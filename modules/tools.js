module.exports = {
    getPreviousMonday: function() {
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
    },

    capitalizeFirstLetter: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
