const mongoose = require('mongoose');

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://127.0.0.1:27017/employee-records", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("mongodb connection successful");
}).catch((err) => {
    console.error(err);
});