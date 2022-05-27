const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
 require('dotenv').config()


const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const hbs = require('express-handlebars');
const app = express();
const fileUpload=require('express-fileupload')
const db=require('./config/connectiion');
const session=require('express-session')
const { log } = require('console');
const { format } = require('path');
const { helpers } = require('handlebars');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  helpers: {counter:(index)=>index+1,

  format: function(date){
    let string=date.toString()
    string = string.slice(0,10)
     return string},

     date: function(day){
      let date=new Date(day)
      return date.toLocaleDateString()
     }

    },
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials'
}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({secret:"key",cookie:{maxAge:600000}}))



db.connect((err)=>{
  if(err) console.log("connection Error");
  else console.log("Database connected to port 27017 ");
})
app.use('/', userRouter);
app.use('/admin', adminRouter);

app.get("*",(req,res)=>{
  res.render("404",{title:"404 page",})
})
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
