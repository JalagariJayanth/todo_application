const format = require("date-fns/format");
const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryPropertyAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryPropertyAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    case hasCategoryPropertyAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}'
        AND category = '${category}'`;
      break;
    case hasCategoryProperties(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}'`;
      break;
    case hasCategoryPropertyAndPriorityProperties(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}'
        AND category = '${category}'`;
      break;

    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getquery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const query = await db.get(getquery);
  response.send(query);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = format(new Date(date), "yyyy-MM-dd");
  const getquery = `SELECT * FROM todo WHERE due_date = ${newDate}`;
  const query = await db.get(getquery);
  response.send(query);
});

app.post("/todos/", async (request, response) => {
  const details = request.body;
  const { id, todo, priority, status, category, dueDate } = details;
  const create = `INSERT INTO todo 
     VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}')`;
  await db.run(create);
  response.send("Todo Successfully Added");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const delQuery = `DELETE FROM todo
    WHERE id = '${todoId}';`;
  await db.run(delQuery);
  response.send("Todo Deleted");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updated = "";
  const requestBody = request.body;
  console.log(requestBody);
  switch (true) {
    case requestBody.status !== undefined:
      updated = "Status";
      break;
    case requestBody.priority !== undefined:
      updated = "Priority";
      break;
    case requestBody.todo !== undefined:
      updated = "Todo";
      break;
    case requestBody.category !== undefined:
      updated = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updated = "Due Date";
      break;
  }
  const exisitingquery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const exisitingTodo = await db.get(exisitingquery);

  const {
    todo = exisitingTodo.todo,
    status = exisitingTodo.status,
    priority = exisitingTodo.priority,
    category = exisitingTodo.category,
    due_date = exisitingTodo.due_date,
  } = request.body;
  const updatequery = `UPDATE todo SET todo = '${todo}',
    priority = '${priority}',status = '${status}',category = '${category}',due_date = '${due_date}'
    WHERE id = ${todoId}`;
  await db.run(updatequery);
  response.send(`${updated} Updated`);
});
