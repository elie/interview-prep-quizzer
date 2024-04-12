require('dotenv').config();
const { OpenAI } = require("openai");
const readline = require('node:readline/promises');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const openai = new OpenAI(process.env.OPENAI_API_KEY);

const TOPICS = {
  arrays: ["map", "filter", "reduce", "includes", "indexOf", "pop", "push", "shift", "unshift"],
  objects: ["keys", "values", "entries", "dot vs bracket notation"],
  loops: ["for loop", "while loop", "for...of loop", "forEach method"],
  strings: ["slice", "split", "join", "replace"],
  functions: ["function declaration", "function expression", "arrow function", "callback function"],
};

function pickRandomTopic(options = TOPICS) {
  const topicsKeys = Object.keys(options);
  const randomTopicKey = topicsKeys[Math.floor(Math.random() * topicsKeys.length)];
  const subtopics = options[randomTopicKey];
  return subtopics[Math.floor(Math.random() * subtopics.length)];
}

async function generateQuestionAndAnswer(topic) {
  const prompt = `
    Create a JavaScript quiz question and its answer about the ${topic} topic.
    Keep the question length short and do not show any code snippets. This should
    strictly be a text-based question and answer.
  `;
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.5,
    max_tokens: 150,
  });

  console.log("response", response.choices[0].message)

  const fullResponse = response.choices[0].message.content;
  const splitResponse = fullResponse.split("\n");
  const question = splitResponse[0];
  const answer = splitResponse[2] || 'No answer provided'; // Fallback if split fails
  return { question, answer };
};

async function evaluateAnswer(userAnswer, correctAnswer) {
  const prompt = `Given the correct answer is: "${correctAnswer}", evaluate the following user answer: "${userAnswer}".
  Is the user's answer correct, or incorrect? Even if the answer is not complete, or partially correct, mark it as correct.

  Be sure to provide a clear and concise evaluation. Do not require necessary context to fully explain usage.
  Not detailed answers can still be correct. Do not require a full explanation.

  Give me a very short response to evaluate the user's answer. It should be either "Correct" or "Incorrect".
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.5,
    max_tokens: 10,
  });

  return response.choices[0].message.content;
};

async function collectUserInput(question) {
  const userAnswer = await rl.question(`${question}\nYour answer: `);
  if (userAnswer.toLowerCase() === "quit") {
    console.log("Quitting...");
    rl.close();
  }
  rl.clearLine();
  return userAnswer;
}

async function main() {
  const randomSubtopic = pickRandomTopic();

  const { question, answer } = await generateQuestionAndAnswer(randomSubtopic);
  const userAnswer = await collectUserInput(question);
  const evaluation = await evaluateAnswer(userAnswer, answer);

  console.log(`Evaluation of your answer: ${evaluation}`);
  console.log(`Correct answer: ${answer}`);
  main();
};


main();
