// Check if we're building AI service CSS
const isAIServiceBuild = process.env.AI_SERVICE_BUILD === "true";

export default isAIServiceBuild 
  ? {
      plugins: {
        "@tailwindcss/postcss": {},
      },
    }
  : {
      plugins: {
        "@tailwindcss/postcss": {},
      },
    };
