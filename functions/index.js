const functions = require('firebase-functions');
const cheerio = require('cheerio');
const Router = require('express').Router
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const request = require('request');

const api = Router();
api.use(cors);
api.post('*', (req, res) => {

    const page = parseInt(getStringUndefined(req.body.page), 0);
    const lastCommentIndex = (page-1) * 5;
    let url = getStringUndefined(req.body.url);

    url = url.replace("Reviews-", `Reviews-or${lastCommentIndex}-`);

    request(url, (error, response, html) => {
        if (!error) {
            const $ = cheerio.load(html);
            const name = $('#HEADING').text();
            const overall = $('span.overallRating').text().trim();
            const lastPage = $('a.pageNum.last.taLnk').text();
            const currentPage = $('a.pageNum.current').text();
            const reviews = $('div.reviewSelector');
            const comments = [];

            console.log(typeof reviews);
            console.log(typeof comments);

            reviews.each(i => {
                const $ = cheerio.load(reviews[i]);
                const user = $('div.member_info .info_text div:first-child').text();
                const userLocation = $('div.member_info .info_text div.userLoc').text();
                const avatar = $('div.ui_avatar.resp img').attr('data-lazyurl');
                const ratingDate = $('span.ratingDate').attr('title');
                const rating = $('span.ui_bubble_rating').attr('class');
                const quotes = $('span.noQuotes').text();
                const comment = $('.ui_column > .prw_rup p.partial_entry').text();
                const reply = $('.mgrRspnInline p.partial_entry').text();
                const replyDate = $('span.responseDate').text().replace("Responded ", "");

                comments.push({
                    user: user,
                    userLocation: userLocation,
                    avatar: avatar,
                    ratingDate: ratingDate,
                    rating: getRating(rating),
                    quotes: quotes,
                    comment: comment,
                    reply : {
                        comment: reply,
                        replyDate: replyDate
                    }
                })
            });

            res.status(200).send({
                name: name,
                currentPage: currentPage,
                lastPage: lastPage,
                rating: overall,
                comments: comments
            });

        } else {
            res.status(404).send({success: false});
        }
    });
});

function getStringUndefined(text) {
    if (typeof text === "undefined") {
        return '';
    } else {
        return text;
    }
}

getRating = function (string) {
    if (string.indexOf('50') > -1) {
        return "5";
    } else if (string.indexOf('40') > -1) {
        return "4";
    } else if (string.indexOf('30') > -1) {
        return "3";
    } else if (string.indexOf('20') > -1) {
        return "2";
    } else if (string.indexOf('10') > -1) {
        return "1";
    } else {
        return "0";
    }
};

exports.getReviews = functions.https.onRequest(api);