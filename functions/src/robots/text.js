const credentials = require('../database/credentials.json');

const googleTranslate = require("@vitalets/google-translate-api");
const algorithmia = require("algorithmia")(credentials.algorithmiaKey);
const axios = require('axios');

const { readDebugPage, writeDebugPage } = require('../debug/debug');
const fonts = require('../robots/fonts');


const listFilter = require('../database/listFilter.json')

var self = module.exports = {
    async  getNews(someURL) {
        const options = {
            method: 'get',
            url: someURL,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36'
            }
        };

        const { data, request } = await axios(options)
        const host = request.connection._host
        const url = host + request.path;
        /*****************DEBUG SCOPE*******************/
        // writeDebugPage(data)
        // const data = await readDebugPage()
        /*****************DEBUG SCOPE*******************/

        return { data, host, url };
    },

    getFrom(host, data) {
        let response

        switch (host) {
            case "www.bbc.com": {
                response = fonts(data).bbc();
                break
            }
            case "www.cnn.com":
                response = fonts(data).cnn(); {
                    break
                }
            case "www.g1.com": {
                response = fonts(data).g1();
                break
            }
            case "www.uol.com": {
                response = fonts(data).uol();
                break
            }
        }
        return response;
    },

    hostAvailable(someHost, url) {
        let hosts = Object.keys(listFilter)
        if (!hosts.includes(someHost)) {
            let err = new Error()
            err.code = 406
            err.address = url
            err.message = "This host is not available in this application."
            err.info = `You could try these hosts: ${hosts}`
            throw err
        }
    },

    async  getTranslationToEn(strings) {
        let newString = strings.join('  ')
        let response = await googleTranslate(newString, { to: 'en' })
        let news = response.text.split('  ')
        let lang = response.from.language.iso
        return { news, lang }
    },

    async  getReTranslation(strings, lang) {
        if (lang === 'en') {
            return strings
        }
        else {
            let response = await googleTranslate(strings, { to: lang })
            return response.text;
        }
    },

    sanitizeNews(news, host) {
        return news.filter((item) => {
            return !listFilter[host].includes(item);
        }).join(' ')
            .replace(/&#9642/gi, '')
    },

    translatedLang(reqLang, detectedLang) {
        if (!reqLang) {
            return detectedLang
        }
        else {
            return reqLang
        }
    },

    async  getSummarize(news) {
        let response = await algorithmia
            .algo('nlp/Summarizer/0.1.8')
            .pipe(news)
        return response.get()
    },

    async  getHashtags(news) {
        let response = await algorithmia
            .algo("SummarAI/Summarizer/0.1.3")
            .pipe(news)
        let { auto_gen_ranked_keywords } = response.get();
        return auto_gen_ranked_keywords.join(' ')
    },

    getReferenciate(host) {
        return `(Font: www.${host})`
    },

    buildCaption(summary, reference, hashtags) {
        let arrays = [summary, reference, hashtags.split(' ').slice(0, 5).map(s => "#" + s).join(' ')].join(' \n ');
        return arrays;
    },
}