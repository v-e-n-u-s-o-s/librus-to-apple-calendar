'use strict'
const { writeFile } = require('fs');
const uuidv4 = require("uuid/v4");
const Librus = require('librus-api');
var tools = require('./tools');
let saved;

function addEvent(year, month, day, hour, minute, duration, title, teacher, category, to_year, to_month, to_day) {
    let date = new Date();
    let now_year, now_month, now_day, now_hour, now_minutes, now_seconds;
    [year, month, day, hour, minute, duration, title, teacher, category, now_year, now_month, now_day, now_hour, now_minutes, now_seconds] = [year.toString(), month.toString(), day.toString(), hour.toString(), minute.toString(), duration.toString(), title.toString(), teacher.toString(), category.toString(), date.getFullYear().toString(), (date.getMonth() + 1).toString(), date.getDate().toString(), date.getHours().toString(), date.getMinutes().toString(), date.getSeconds().toString()]

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    if (hour.length < 2) hour = "0" + hour;
    if (minute.length < 2) minute = "0" + minute;
    if (now_year.length < 2) now_year = "0" + now_year;
    if (now_month.length < 2) now_month = "0" + now_month;
    if (now_day.length < 2) now_day = "0" + now_day;
    if (now_hour.length < 2) now_hour = "0" + now_hour;
    if (now_minutes.length < 2) now_minutes = "0" + now_minutes;
    if (now_seconds.length < 2) now_seconds = "0" + now_seconds;

    let event = `BEGIN:VEVENT` + '\r\n';
    event += `UID:${uuidv4()}@librustocalendar.ddns.net` + '\r\n';
    event += `SUMMARY:${tools.capitalizeFirstLetter(title)}` + '\r\n';
    event += `DTSTAMP:${now_year}${now_month}${now_day}T${now_hour}${now_minutes}${now_seconds}` + '\r\n';
    event += `DTSTART:${year}${month}${day}T${hour}${minute}00` + '\r\n';
    event += `DURATION:PT${duration}M` + '\r\n';
    event += `RRULE:FREQ=WEEKLY;UNTIL=${to_year}${to_month}${to_day}T000000` + '\r\n';
    event += `ORGANIZER:CN=${teacher}` + '\r\n';
    event += `CATEGORIES:${tools.capitalizeFirstLetter(category)}` + '\r\n';
    event += `END:VEVENT` + '\r\n';

    return event;
}

module.exports = {
    startCalendar: function () {
        let beginning = "BEGIN:VCALENDAR" + '\r\n';
        beginning += "VERSION:2.0" + '\r\n';
        beginning += "PRODID:-//v-e-n-u-s-o-s//Librus to calendar//EN" + '\r\n';
        beginning += "CALSCALE:GREGORIAN" + '\r\n';
        beginning += "METHOD:PUBLISH" + '\r\n';
        return beginning;
    },

    endCalendar: function (data) {
        return data + "END:VCALENDAR";
    },

    saveCalendar: function (filename, data) {
        writeFile("./public/calendars/" + filename, data, function (err) {
            if (err) console.log(err);
        });
        return "Saved";
    },

    getTimetable: function (data) {
        if (data) saved = data;
        else if (saved) {
            let temp = saved;
            saved = undefined;
            return temp;
        }
    },

    generateTimetable: function (login, password, length) {
        let client = new Librus();
        let events = "";
        try {
            client.authorize(login, password).then(function () {
                client.calendar.getTimetable().then(data => {
                    let i = 0;
                    let year, month, day, hour, minute, duration, title, teacher, category, temp, to_year, to_month, to_day;
                    Object.keys(data.table).forEach(function (days) {
                        for (let hours = 0; hours < data.hours.length; hours++) {
                            if (data.table[days][hours]) {
                                year = tools.getPreviousMonday().getFullYear();
                                month = tools.getPreviousMonday().getUTCMonth() + 1;
                                day = tools.getPreviousMonday().getUTCDate() + i;
                                temp = data.hours[hours].split('-')[0].split(":");
                                hour = temp[0].replace(" ", "").trim();
                                minute = temp[1].replace(" ", "").trim();
                                duration = 45;
                                temp = data.table[days][hours].title.split('-');
                                title = temp[0].trim();
                                teacher = temp[1].trim();
                                category = "lesson";
                                to_year = length[0];
                                to_month = length[1];
                                to_day = length[2];
                                events += addEvent(year, month, day, hour, minute, duration, title, teacher, category, to_year, to_month, to_day);
                            }
                            else continue;
                        }
                        i++;
                    })
                })
            })
        }
        catch (err) {
            if (err) {
                console.error(err.message);
                client = null;
                events = null;
                saved = null;
            }
        }
        let i = 0;
        let interval = setInterval(() => {
            i++;
            if (events.length > 10) {
                this.getTimetable(events);
                i = 0;
                client = null;
                clearInterval(interval);
            }
            if (i > 5) {
                this.getTimetable("Error")
                i = 0;
                client = null;
                clearInterval(interval);
            }
        }, 500)
    }
}