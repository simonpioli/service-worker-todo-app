import Koa = require('koa');
import Router = require('koa-router');
const cors = require('@koa/cors');
import bodyParser = require('koa-bodyparser');

const Port = 8765;

interface Todo {
  id: number;
  completed: boolean;
  title: string;
}

let todos: Todo[] = [
  { id: 1, title: 'Hello world!', completed: true },
];

const router = new Router();

const app = new Koa();

app.use(cors());
app.use(bodyParser());

function queryMatcher(query: { [key: string]: string }, todo: Todo) {
  return (
    (!('id' in query) || todo.id === parseInt(query.id, 10)) &&
    (!('completed' in query) || todo.completed === (query.completed === 'true' ? true : false))
  );
}

router.get('/todos', async (ctx) => {
  ctx.body = todos.filter((todo) => queryMatcher(ctx.query, todo));
});

router.delete('/todos', async (ctx) => {
  ctx.body = todos = todos.filter((todo) => !queryMatcher(ctx.query, todo));
});

router.get('/todos/count', async (ctx) => {
  const total = todos.length;

  let i = total;
  let completed = 0;

  while (i--) {
    completed += todos[i].completed ? 1 : 0;
  }

  const active = total - completed;

  ctx.body = { total, active, completed };
});

router.post('/todos', async (ctx) => {
  const todo = ctx.request.body as Todo;

  todos.push(todo);

  ctx.body = todo;
});

router.patch('/todos/:id', async (ctx) => {
  const id = parseInt(ctx.params.id);
  const changes = ctx.request.body as Partial<Todo>;

  const todo = todos.find((todo) => todo.id === id);

  Object.assign(todo, changes);

  ctx.body = todo;
});

app.use(router.routes());

app.listen(Port);

console.info(`Listening on http://localhost:${Port}/`);