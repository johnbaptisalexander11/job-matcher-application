// Skill dictionary used by the local (offline) matching engine.
// Each skill has a display name, a category, and the aliases that count as a mention.
// Aliases are matched case-insensitively on word boundaries, so "java" does not match "javascript".
// "implies" lists skills a CV also has when it shows this one (MySQL means the candidate knows SQL).

export const SKILLS = [
  // Languages
  { name: "JavaScript", category: "Languages", aliases: ["javascript", "js", "es6", "ecmascript"] },
  { name: "TypeScript", category: "Languages", aliases: ["typescript", "ts"], implies: ["JavaScript"] },
  { name: "Python", category: "Languages", aliases: ["python"] },
  { name: "Java", category: "Languages", aliases: ["java"] },
  { name: "C#", category: "Languages", aliases: ["c#", "csharp", "c sharp"] },
  { name: "C++", category: "Languages", aliases: ["c++", "cpp"] },
  { name: "PHP", category: "Languages", aliases: ["php"] },
  { name: "Go", category: "Languages", aliases: ["golang"] },
  { name: "Kotlin", category: "Languages", aliases: ["kotlin"] },
  { name: "Swift", category: "Languages", aliases: ["swift"] },
  { name: "Dart", category: "Languages", aliases: ["dart"] },
  { name: "SQL", category: "Languages", aliases: ["sql"] },

  // Frontend
  { name: "React", category: "Frontend", aliases: ["react", "react.js", "reactjs"], implies: ["JavaScript"] },
  { name: "Next.js", category: "Frontend", aliases: ["next.js", "nextjs"], implies: ["React","JavaScript"] },
  { name: "Angular", category: "Frontend", aliases: ["angular"] },
  { name: "Vue", category: "Frontend", aliases: ["vue", "vue.js", "vuejs"] },
  { name: "HTML", category: "Frontend", aliases: ["html", "html5"] },
  { name: "CSS", category: "Frontend", aliases: ["css", "css3"] },
  { name: "Tailwind CSS", category: "Frontend", aliases: ["tailwind", "tailwindcss"] },
  { name: "Bootstrap", category: "Frontend", aliases: ["bootstrap"] },
  { name: "Redux", category: "Frontend", aliases: ["redux"] },

  // Backend
  { name: "Node.js", category: "Backend", aliases: ["node.js", "nodejs", "node"], implies: ["JavaScript"] },
  { name: "Express.js", category: "Backend", aliases: ["express", "express.js", "expressjs"], implies: ["Node.js","JavaScript"] },
  { name: "ASP.NET Core", category: "Backend", aliases: ["asp.net", "asp.net core", ".net", ".net core", "dotnet"], implies: ["C#"] },
  { name: "Entity Framework", category: "Backend", aliases: ["entity framework", "ef core"] },
  { name: "Spring Boot", category: "Backend", aliases: ["spring boot", "spring framework"], implies: ["Java"] },
  { name: "Django", category: "Backend", aliases: ["django"], implies: ["Python"] },
  { name: "Flask", category: "Backend", aliases: ["flask"], implies: ["Python"] },
  { name: "FastAPI", category: "Backend", aliases: ["fastapi"], implies: ["Python"] },
  { name: "Laravel", category: "Backend", aliases: ["laravel"] },
  { name: "REST APIs", category: "Backend", aliases: ["rest api", "rest apis", "restful", "restful api", "restful apis"] },
  { name: "GraphQL", category: "Backend", aliases: ["graphql"] },
  { name: "Microservices", category: "Backend", aliases: ["microservices", "microservice"] },

  // Databases
  { name: "MySQL", category: "Databases", aliases: ["mysql"], implies: ["SQL"] },
  { name: "PostgreSQL", category: "Databases", aliases: ["postgresql", "postgres"], implies: ["SQL"] },
  { name: "MongoDB", category: "Databases", aliases: ["mongodb", "mongo", "mongoose"] },
  { name: "SQLite", category: "Databases", aliases: ["sqlite"], implies: ["SQL"] },
  { name: "SQL Server", category: "Databases", aliases: ["sql server", "mssql"], implies: ["SQL"] },
  { name: "Firebase", category: "Databases", aliases: ["firebase", "firestore"] },
  { name: "Redis", category: "Databases", aliases: ["redis"] },

  // Mobile
  { name: "Android", category: "Mobile", aliases: ["android", "android studio"] },
  { name: "React Native", category: "Mobile", aliases: ["react native"] },
  { name: "Flutter", category: "Mobile", aliases: ["flutter"] },

  // AI / Data
  { name: "Machine Learning", category: "AI & Data", aliases: ["machine learning", "ml"] },
  { name: "Deep Learning", category: "AI & Data", aliases: ["deep learning", "neural network", "neural networks"] },
  { name: "LLMs", category: "AI & Data", aliases: ["llm", "llms", "large language model", "large language models", "generative ai", "genai", "gen ai"] },
  { name: "Prompt Engineering", category: "AI & Data", aliases: ["prompt engineering", "prompting"] },
  { name: "RAG", category: "AI & Data", aliases: ["rag", "retrieval augmented generation", "retrieval-augmented generation"], implies: ["LLMs"] },
  { name: "NLP", category: "AI & Data", aliases: ["nlp", "natural language processing"] },
  { name: "Computer Vision", category: "AI & Data", aliases: ["computer vision", "opencv"] },
  { name: "TensorFlow", category: "AI & Data", aliases: ["tensorflow", "keras"], implies: ["Python","Deep Learning","Machine Learning"] },
  { name: "PyTorch", category: "AI & Data", aliases: ["pytorch"], implies: ["Python","Deep Learning","Machine Learning"] },
  { name: "scikit-learn", category: "AI & Data", aliases: ["scikit-learn", "sklearn"], implies: ["Python","Machine Learning"] },
  { name: "Pandas", category: "AI & Data", aliases: ["pandas"] },
  { name: "NumPy", category: "AI & Data", aliases: ["numpy"] },
  { name: "LangChain", category: "AI & Data", aliases: ["langchain"] },
  { name: "Vector Databases", category: "AI & Data", aliases: ["vector database", "vector databases", "pinecone", "chromadb", "faiss", "embeddings"] },
  { name: "Data Analysis", category: "AI & Data", aliases: ["data analysis", "data analytics", "business analytics", "power bi", "tableau"] },
  { name: "Jupyter", category: "AI & Data", aliases: ["jupyter", "jupyter notebook"] },

  // DevOps / Cloud / Tools
  { name: "Git", category: "Tools", aliases: ["git", "github", "gitlab", "bitbucket"] },
  { name: "Docker", category: "Tools", aliases: ["docker", "containers"] },
  { name: "Kubernetes", category: "Tools", aliases: ["kubernetes", "k8s"] },
  { name: "CI/CD", category: "Tools", aliases: ["ci/cd", "ci cd", "github actions", "jenkins", "continuous integration"] },
  { name: "AWS", category: "Tools", aliases: ["aws", "amazon web services"] },
  { name: "Azure", category: "Tools", aliases: ["azure"] },
  { name: "Google Cloud", category: "Tools", aliases: ["gcp", "google cloud"] },
  { name: "Linux", category: "Tools", aliases: ["linux", "bash", "shell scripting"] },
  { name: "Swagger", category: "Tools", aliases: ["swagger", "openapi", "postman"] },
  { name: "Jira", category: "Tools", aliases: ["jira"] },

  // Concepts / practices
  { name: "OOP", category: "Concepts", aliases: ["oop", "object oriented", "object-oriented"] },
  { name: "Data Structures & Algorithms", category: "Concepts", aliases: ["data structures", "algorithms", "dsa"] },
  { name: "Authentication", category: "Concepts", aliases: ["authentication", "jwt", "oauth", "auth"] },
  { name: "RBAC", category: "Concepts", aliases: ["rbac", "role-based access control", "role based access control"] },
  { name: "System Design", category: "Concepts", aliases: ["system design", "software architecture"] },
  { name: "Testing", category: "Concepts", aliases: ["testing", "unit testing", "unit tests", "jest", "test-driven", "tdd"] },
  { name: "Agile", category: "Concepts", aliases: ["agile", "scrum", "kanban"] },
  { name: "Networking", category: "Concepts", aliases: ["networking", "tcp/ip", "packet tracer"] },

  // Soft skills
  { name: "Communication", category: "Soft skills", aliases: ["communication", "communicate"] },
  { name: "Teamwork", category: "Soft skills", aliases: ["teamwork", "team player", "collaboration", "collaborate"] },
  { name: "Problem Solving", category: "Soft skills", aliases: ["problem solving", "problem-solving"] },
];
