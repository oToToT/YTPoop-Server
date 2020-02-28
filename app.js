// load packages
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const flash = require('req-flash');

// load models
const passport = require('./models/auth');

// load routers
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();
const session_secret = process.env.S_SECRET || 'MinamiKotori_is_the_best.'

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// load middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    store: new SQLiteStore({
        table: 'sessions',
        db: 'testdb.sqlite3',
        dir: '.',
        concurrentDB: false
    }),
    secret: session_secret,
    resave: false,
    saveUninitialized: false,
    unset: 'keep',
    cookie: { 
        //secure: true,  // should be enable when using SSL
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
}))
app.use(flash());

// load passport
app.use(passport.initialize());
app.use(passport.session());

// routing
app.use(express.static(path.join(__dirname, 'assets')));
app.use('/', indexRouter);
app.use('/users', usersRouter);

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
