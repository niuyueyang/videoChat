const server = require('./server');
const app = new server();
app.listen(port => {
    console.log(`Server is listening on http://localhost:${port}`);
})
