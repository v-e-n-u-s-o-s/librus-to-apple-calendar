'use strict';
const express = require('express');
const Librus = require('librus-api');
const { writeFile } = require('fs');
const uuidv4 = require("uuid/v4")
const router = express.Router();

var raw_data;
var calendar = ``;
var filename = '';

let saved = false;

module.exports = router;

router.get('/', function (req, res) {
    if (!res.query.calendar) res.sendFile()
    else {
        res.send(current_url + "calendars/" + filename)
    }
})

router.get('/calendar', function (req, res) {
    let client = new Librus();
    const current_url = req.protocol + '://' + req.get('host') + "/";

    let login = req.query.login;
    let password = req.query.password;
    filename = req.query.filename + ".ics";
    let to_date = req.query.to_date.split('-');

    if (login == "" || password == "" || filename == "" || to_date == "") res.redirect(current_url)
    else {
        client.authorize(login, password).then(function () {
            client.calendar.getTimetable().then(data => { if (data.hours.length > 0) raw_data = data; else { res.redirect(current_url) } });
        })

        createCalendar();

        let day_iterator = 0;
        let year, month, day, hour, minute, duration, title, teacher, category, temp, to_year, to_month, to_day;

        Object.keys(raw_data.table).forEach(function (days) {
            for (let hours = 0; hours < raw_data.hours.length; hours++) {
                if (raw_data.table[days][hours]) {
                    year = getPreviousMonday().getFullYear();
                    month = getPreviousMonday().getUTCMonth() + 1;
                    day = getPreviousMonday().getUTCDate() + day_iterator;
                    temp = raw_data.hours[hours].split('-')[0].split(":");
                    hour = temp[0].replace(" ", "").trim();
                    minute = temp[1].replace(" ", "").trim();
                    duration = 45;
                    temp = raw_data.table[days][hours].title.split('-');
                    title = temp[0];
                    teacher = temp[1];
                    category = "lesson";
                    to_year = to_date[0];
                    to_month = to_date[1];
                    to_day = to_date[2];
                    addEvent(year, month, day, hour, minute, duration, title, teacher, category, to_year, to_month, to_day);
                }
                else continue;
            }
            day_iterator++;
        })

        endCalendar();
        saveCalendar();

        let interval = setInterval(() => { if (saved) res.redirect(current_url + "?url=" + current_url + "calendars/" + filename); clearInterval(interval) }, 500)
    }
});

function createCalendar() {
    calendar =
        `BEGIN: VCALENDAR
VERSION: 2.0
CALSCALE: GREGORIAN
PRODID: 金星軸 / v-e-n-u-s-o-s
METHOD: PUBLISH
X - PUBLISHED - TTL: PT1H
`;
}

function endCalendar() {
    calendar += "END:VCALENDAR";
}

function saveCalendar() {
    writeFile("./public/calendars/" + filename, calendar, function (err) {
        if (err) throw err;
        saved = true;
    });
}

function getPreviousMonday() {
    var date = new Date();
    var day = date.getDay();
    var prevMonday = new Date();
    if (date.getDay() == 0) {
        return date;
    }
    else {
        prevMonday.setDate(date.getDate() - (day - 1));
    }
    return prevMonday;
}

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function addEvent(year, month, day, hour, minute, duration, title, teacher, category, to_year, to_month, to_day) {
    [year, month, day, hour, minute, duration, title, teacher, category] = [year.toString(), month.toString(), day.toString(), hour.toString(), minute.toString(), duration.toString(), title.toString(), teacher.toString(), category.toString()]

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    if (hour.length < 2) hour = "0" + hour;
    if (minute.length < 2) minute = "0" + minute;

    calendar += `BEGIN:VEVENT
UID:${uuidv4()}
SUMMARY:${capitalizeFirstLetter(title)}
DTSTART:${year}${month}${day}T${hour}${minute}00
DURATION:PT${duration}M
RRULE:FREQ=WEEKLY;UNTIL=${to_year}${to_month}${to_day}T000000
ORGANIZER:CN=${teacher}
CATEGORIES:${capitalizeFirstLetter(category)}
END:VEVENT
`
}