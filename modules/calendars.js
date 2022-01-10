'use strict'
const { writeFile } = require('fs');
const uuidv4 = require("uuid/v4");
const Librus = require('librus-api');
var tools = require('./tools');
let saved;

function addEvent(year, month, day, hour, minute, duration, title, teacher, category, to_year, to_month, to_day) {
    [year, month, day, hour, minute, duration, title, teacher, category] = [year.toString(), month.toString(), day.toString(), hour.toString(), minute.toString(), duration.toString(), title.toString(), teacher.toString(), category.toString()]

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    if (hour.length < 2) hour = "0" + hour;
    if (minute.length < 2) minute = "0" + minute;

    return `BEGIN:VEVENT
UID:${uuidv4()}
SUMMARY:${tools.capitalizeFirstLetter(title)}
DTSTART:${year}${month}${day}T${hour}${minute}00
DURATION:PT${duration}M
RRULE:FREQ=WEEKLY;UNTIL=${to_year}${to_month}${to_day}T000000
ORGANIZER:CN=${teacher}
CATEGORIES:${tools.capitalizeFirstLetter(category)}
END:VEVENT
`
}

module.exports = {
    startCalendar: function () {
        return `BEGIN: VCALENDAR
VERSION: 2.0
CALSCALE: GREGORIAN
PRODID: 金星軸 / v-e-n-u-s-o-s
METHOD: PUBLISH
X - PUBLISHED - TTL: PT1H
`;
    },

    endCalendar: function (data) {
        return data + `END:VCALENDAR`;
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
                                title = temp[0];
                                teacher = temp[1];
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