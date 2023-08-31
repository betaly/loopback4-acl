import {Todo} from './fixtures/components/todo';

/**
 * Generate a complete Todo object for use with tests.
 * @param todo - A partial (or complete) Todo object.
 */
export function givenTodo(todo?: Partial<Todo>) {
  const data = Object.assign(
    {
      userId: 'tom',
      title: 'do a thing',
      desc: 'There are some things that need doing',
      isComplete: false,
    },
    todo,
  );
  return new Todo(data);
}
