import supabase from '../db';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import fs from 'fs';
import path from 'path';

export interface CollegeRecord {
  id: number;
  name: string;
  location: string;
  state: string;
  type: string;
  category: string;
  fees_per_year: number;
  total_fees: number;
  rating: number;
  ranking_nirf: number;
  established: number;
  courses: string[] | string;
  placement_avg_lpa: number;
  placement_highest_lpa: number;
  placement_percent: number;
  description: string;
  website: string;
}

/**
 * Retrieve relevant college documents from Supabase or local seed data based on user query.
 */
export async function retrieveCollegeContext(
  query: string,
  contextCollegeIds?: (number | string)[]
): Promise<Document[]> {
  try {
    const lowerQuery = (query || '').toLowerCase();
    let colleges: CollegeRecord[] = [];

    // If explicit college IDs are provided (e.g. from compare page)
    if (contextCollegeIds && contextCollegeIds.length > 0) {
      const ids = contextCollegeIds.map(id => Number(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const { data } = await supabase
          .from('colleges')
          .select('*')
          .in('id', ids);
        if (data && data.length > 0) colleges = data as CollegeRecord[];
      }
    }

    // If no explicit IDs or Supabase returned 0
    if (colleges.length === 0) {
      let collegeList: CollegeRecord[] = [];

      // 1. Try Supabase
      try {
        const { data: allColleges } = await supabase
          .from('colleges')
          .select('*')
          .order('ranking_nirf', { ascending: true });
        if (allColleges && allColleges.length > 0) {
          collegeList = allColleges as CollegeRecord[];
        }
      } catch (err) {
        console.warn('Supabase query warning, switching to seed data fallback.');
      }

      // 2. Fallback to local JSON seed data if Supabase has 0 rows
      if (collegeList.length === 0) {
        try {
          const jsonPath = path.resolve(process.cwd(), 'src/seed/colleges.json');
          if (fs.existsSync(jsonPath)) {
            const fileData = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(fileData);
            collegeList = parsed.map((c: any, index: number) => ({
              id: c.id || index + 1,
              ...c,
            }));
          } else {
            console.error('colleges.json path does not exist:', jsonPath);
          }
        } catch (e) {
          console.error('Failed to load local colleges fallback:', e);
        }
      }

      console.log(`RAG Retriever: Total colleges loaded: ${collegeList.length}`);

      // Clean query tokens for precise matching
      const cleanTokens = lowerQuery
        .replace(/[^\w\s]/gi, ' ')
        .split(/\s+/)
        .filter(t => t.length >= 2);

      // Filter matched colleges by name, state, location, or course keywords
      const matched = collegeList.filter(c => {
        const cNameLower = (c.name || '').toLowerCase();
        const cStateLower = (c.state || '').toLowerCase();
        const cLocLower = (c.location || '').toLowerCase();

        // Exact substring match in college name (e.g. "iit bombay", "bits pilani")
        const directNameMatch = cleanTokens.some(t => t.length >= 3 && cNameLower.includes(t)) ||
                                lowerQuery.includes(cNameLower);

        const stateMatch = cStateLower && cleanTokens.includes(cStateLower);
        const locMatch = cLocLower && cleanTokens.some(t => t.length >= 4 && cLocLower.includes(t));

        let courseMatch = false;
        if (Array.isArray(c.courses)) {
          courseMatch = c.courses.some(crs => cleanTokens.includes((crs || '').toLowerCase()));
        } else if (typeof c.courses === 'string') {
          courseMatch = cleanTokens.some(t => (c.courses as string).toLowerCase().includes(t));
        }

        return directNameMatch || stateMatch || locMatch || courseMatch;
      });

      console.log(`RAG Retriever: Matched colleges count: ${matched.length}`);

      // If matches found, use top matches (up to 6), otherwise fallback to top NIRF ranked colleges
      if (matched.length > 0) {
        colleges = matched.slice(0, 6);
      } else {
        colleges = collegeList.slice(0, 6); // default to top 6 colleges
      }
    }

    // Convert raw college records to LangChain Document format
    return colleges.map(c => {
      const parsedCourses = Array.isArray(c.courses)
        ? c.courses.join(', ')
        : typeof c.courses === 'string'
        ? c.courses
        : 'N/A';

      const content = `
College Name: ${c.name} (ID: ${c.id})
- Location: ${c.location}, ${c.state}
- Type: ${c.type || 'N/A'} | Category: ${c.category || 'N/A'}
- NIRF Ranking: #${c.ranking_nirf || 'Unranked'}
- Rating: ${c.rating ? `${c.rating}/5.0` : 'N/A'}
- Established Year: ${c.established || 'N/A'}
- Courses Offered: ${parsedCourses}
- Annual Tuition Fees: ₹${c.fees_per_year ? c.fees_per_year.toLocaleString('en-IN') : 'N/A'}
- Total Course Fees: ₹${c.total_fees ? c.total_fees.toLocaleString('en-IN') : 'N/A'}
- Average Placement Package: ${c.placement_avg_lpa ? `${c.placement_avg_lpa} LPA` : 'N/A'}
- Highest Placement Package: ${c.placement_highest_lpa ? `${c.placement_highest_lpa} LPA` : 'N/A'}
- Placement Percentage: ${c.placement_percent ? `${c.placement_percent}%` : 'N/A'}
- Overview: ${c.description || 'Top higher education institution.'}
- Official Website: ${c.website || 'N/A'}
      `.trim();

      return new Document({
        pageContent: content,
        metadata: {
          id: c.id,
          name: c.name,
          ranking: c.ranking_nirf,
          avgPlacement: c.placement_avg_lpa,
          highestPlacement: c.placement_highest_lpa,
          fees: c.fees_per_year,
          rating: c.rating,
        },
      });
    });
  } catch (err) {
    console.error('Error in retrieveCollegeContext:', err);
    return [];
  }
}

/**
 * Execute LangChain RAG pipeline with OpenAI Chat Model or intelligent fallback generator
 */
export async function executeRAGQuery(
  userQuery: string,
  contextCollegeIds?: (number | string)[]
): Promise<{ answer: string; retrievedColleges: any[] }> {
  // 1. Retrieve relevant college documents
  const docs = await retrieveCollegeContext(userQuery, contextCollegeIds);
  const contextString = docs.map(d => d.pageContent).join('\n\n---\n\n');

  const retrievedColleges = docs.map(d => ({
    id: d.metadata.id,
    name: d.metadata.name,
    ranking: d.metadata.ranking,
    avgPlacement: d.metadata.avgPlacement,
    highestPlacement: d.metadata.highestPlacement,
    fees: d.metadata.fees,
    rating: d.metadata.rating,
  }));

  const openaiKey = process.env.OPENAI_API_KEY;

  // 2. If OpenAI key is present, execute LangChain ChatOpenAI sequence
  if (openaiKey && openaiKey.trim() !== '' && !openaiKey.includes('your_openai_api_key')) {
    try {
      const chatModel = new ChatOpenAI({
        openAIApiKey: openaiKey,
        modelName: 'gpt-4o-mini',
        temperature: 0.3,
      });

      const promptTemplate = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          `You are **CollegeQuest Advisor**, an expert, friendly, and objective educational counsellor specialising in top Indian colleges and universities.

Your task is to deliver beautifully structured, data-driven answers to student questions, using ONLY the authoritative college data provided in the context section below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATTING RULES (follow exactly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Section headers** — use ## for major sections (e.g. ## 📊 Comparison Overview) and ### for sub-sections.

2. **Comparison table** — when comparing 2+ colleges, ALWAYS render this exact table:
   | Metric | [College A] | [College B] |
   |:---|:---:|:---:|
   | 🏆 NIRF Ranking | #X | #Y |
   | ⭐ Rating | X/5 | Y/5 |
   | 💰 Annual Fees | ₹X | ₹Y |
   | 📦 Total Fees | ₹X | ₹Y |
   | 💼 Avg Placement | X LPA | Y LPA |
   | 🚀 Highest Package | X LPA | Y LPA |
   | 📈 Placement Rate | X% | Y% |
   | 🎓 Established | XXXX | XXXX |

3. **Key Insights** — always include a ## 💡 Key Insights section with 3–5 concise bullet points.

4. **Verdict card** — end every response with:
   ## 🎯 Our Recommendation
   A 2-3 sentence clear, opinionated verdict helping the student decide.

5. **Tone** — warm, encouraging, and precise. Never vague. Avoid jargon. Write like a knowledgeable friend.

6. **Italicise** course names and college names in prose (*IIT Bombay*).

7. If the question is NOT a comparison, provide:
   - A quick-glance stat block (use **bold labels**)
   - Pros and cons as bullet lists
   - A clear recommendation paragraph

8. Never mention internal systems, databases, or technical architecture. You are simply a knowledgeable advisor.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLLEGE DATA (use this as your only source of facts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{context}`
        ),
        HumanMessagePromptTemplate.fromTemplate(`Student question: {query}`),
      ]);

      const chain = promptTemplate.pipe(chatModel).pipe(new StringOutputParser());

      const answer = await chain.invoke({
        context: contextString || 'No specific college matched directly in database.',
        query: userQuery,
      });

      return { answer, retrievedColleges };
    } catch (err: any) {
      console.error('LangChain OpenAI Execution Error:', err?.message || err);
      // Fall through to fallback generator if API call fails
    }
  }

  // 3. Smart Context-Driven Fallback Generator (Zero Setup / Free Mode)
  const answer = generateFallbackRAGResponse(userQuery, docs);
  return { answer, retrievedColleges };
}

/**
 * Intelligent context-aware RAG response generator for free/no-key mode.
 */
function generateFallbackRAGResponse(query: string, docs: Document[]): string {
  if (!docs || docs.length === 0) {
    return `### 🎓 CollegeQuest AI Assistant\n\nI couldn't find specific colleges in our database matching your exact request. Try searching by state (e.g., *Delhi*, *Maharashtra*), course (e.g., *CSE*, *MBA*), or comparing top institutes like **IIT Bombay**, **BITS Pilani**, or **IIT Delhi**!`;
  }

  const colleges = docs.map(d => d.metadata);

  // If user is comparing colleges or multiple colleges retrieved
  if (colleges.length >= 2) {
    const c1 = docs[0];
    const c2 = docs[1];

    let tableRows = '';
    docs.slice(0, 3).forEach(d => {
      tableRows += `| **${d.metadata.name}** | #${d.metadata.ranking || 'N/A'} | ₹${d.metadata.fees ? d.metadata.fees.toLocaleString('en-IN') : 'N/A'} | ${d.metadata.avgPlacement ? `${d.metadata.avgPlacement} LPA` : 'N/A'} | ${d.metadata.highestPlacement ? `${d.metadata.highestPlacement} LPA` : 'N/A'} | ⭐ ${d.metadata.rating || 'N/A'} |\n`;
    });

    // ROI analysis
    const bestPlacementCol = [...docs].sort((a, b) => (b.metadata.avgPlacement || 0) - (a.metadata.avgPlacement || 0))[0];
    const bestRankCol = [...docs].sort((a, b) => (a.metadata.ranking || 999) - (b.metadata.ranking || 999))[0];

    return `### 📊 College Comparison Analysis

Here is a side-by-side data comparison retrieved directly from **CollegeQuest Database**:

| College | NIRF Rank | Annual Fees | Avg Package | Highest Package | Rating |
| :--- | :---: | :---: | :---: | :---: | :---: |
${tableRows}

---

### 💡 Key Takeaways & Comparison Highlights

- 🏆 **Top Ranked Institute**: **${bestRankCol.metadata.name}** holds the highest NIRF rank (**#${bestRankCol.metadata.ranking}**).
- 💼 **Highest Average Placement**: **${bestPlacementCol.metadata.name}** leads in average placement packages (**${bestPlacementCol.metadata.avgPlacement} LPA**).
- 💰 **Return on Investment (ROI)**: Compare annual fees with the average placement packages above. Lower fees combined with high average LPA offer maximum ROI for students.

---

### 🎯 Recommendation Summary
- Choose **${bestRankCol.metadata.name}** for brand prestige, research output, and top peer network.
- Choose **${bestPlacementCol.metadata.name}** for high industry placement packages and strong recruiter connections.

*(Note: To enable live GPT-4o LLM responses, set your \`OPENAI_API_KEY\` in \`backend/.env\`!)*`;
  }

  // Single college summary
  const single = docs[0];
  return `### 🎓 Analysis: ${single.metadata.name}

Here are the authoritative key details for **${single.metadata.name}** from **CollegeQuest**:

- 🏆 **NIRF Ranking**: #${single.metadata.ranking || 'N/A'}
- ⭐ **Rating**: ${single.metadata.rating ? `${single.metadata.rating} / 5.0` : 'N/A'}
- 💼 **Average Placement**: ${single.metadata.avgPlacement ? `${single.metadata.avgPlacement} LPA` : 'N/A'}
- 🚀 **Highest Placement**: ${single.metadata.highestPlacement ? `${single.metadata.highestPlacement} LPA` : 'N/A'}
- 💳 **Annual Tuition Fees**: ₹${single.metadata.fees ? single.metadata.fees.toLocaleString('en-IN') : 'N/A'}

---

### 📌 Summary & Insights
**${single.metadata.name}** offers solid academic infrastructure with an average placement package of **${single.metadata.avgPlacement} LPA**. It is a great choice for students pursuing engineering and management.

*(Note: To unlock live conversational GPT-4o responses, configure your \`OPENAI_API_KEY\` in \`backend/.env\`!)*`;
}
