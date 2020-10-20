const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const mongoose = require('mongoose')
const autoIncrement = require('mongoose-plugin-autoinc')

const config = require('config')
const indexRouter = require('./routes/index')

const passport = require('passport')

const app = express()

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database connection
const dbUtil = require('./lib/db')(config.database)
dbUtil.connect()
// Make db utils globally available
global.db = dbUtil
require('./models/users.model');


app.use('/api/', indexRouter);
app.use('/api/users/',  require('./routes/users.route'));

app.use(passport.initialize())
require('./lib/passport')

module.exports = app;
