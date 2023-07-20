from flask import Flask, request, send_file, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
from langchain.llms import OpenAI
from langchain.agents import create_csv_agent
from langchain.agents.agent_types import AgentType
from langchain.llms.openai import OpenAI

app = Flask(__name__)
CORS(app)

#  Load the OpenAI API key from the .env file
load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
print(os.environ["OPENAI_API_KEY"])

#  Create an instance of the OpenAI class
llm = OpenAI(model_name="text-davinci-003", temperature=0.9)

# Prompt CSV agent with chart data 
@app.route('/api/prompt-agent', methods=['GET','POST'])
def get_prompt_agent():
    if request.method == 'GET':
        question = request.args.get('question')
    elif request.method == 'POST':
        question = request.json.get('question')
    # Get the absolute path of the file
    directory = 'data'
    file_name = 'gapminder.csv' # data file
    file_path = os.path.join(directory, file_name)

    # Call the create_csv_agent function and obtain the CSV data
    agent = create_csv_agent(OpenAI(temperature=0), file_path, verbose=True, agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION)
    response = agent.run(question)
    return {"prompt": question, "response": response}

# Prompt Agent
@app.route('/api/prompt', methods=['GET','POST'])
def get_prompt():
    if request.method == 'GET':
        question = request.args.get('question')
    elif request.method == 'POST':
        question = request.json.get('question')
    print("question", question)
    response = llm(question)
    return {"prompt": question, "response": response}


@app.route('/<path:path>')
def serve_static(path):
  return send_from_directory('public', path)


@app.route('/')
def index():
  return send_file('public/index.html')


if __name__ == '__main__':
  app.run(host='0.0.0.0', port=81, debug=True)
