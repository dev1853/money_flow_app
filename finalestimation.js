exports.rule = {
  title: 'Test Rule',
  guard: (ctx) => {
    return ctx.issue.fields.summary.changed;
  },
  action: (ctx) => {
    // Простое действие, которое ничего не делает, кроме логирования
    console.log('Test rule triggered.');
  }
};