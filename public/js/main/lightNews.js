let rootUrl = 'https://us-central1-light-news.cloudfunctions.net/app/'
if (window.location.port === 5000) {
    rootUrl = 'http://localhost:5001/';
    $('#somethingToRise').val('https://www.bbc.com/portuguese/internacional-52485030')
}

let requisiting = false;
let endNews = false;

initNews()

async function initNews() {
    counterArticles = 0;
    pageCursor = "";
    animateDashboard("news/model.html")
    lightOut();
    while (counterArticles < 10) {
        await getNews();
    }
}

async function getNews() {
    try {
        if (!requisiting && !endNews) {
            requisiting = true;
            let news = await getFromCloud('robotNews', 'GET', { 'pageCursor': pageCursor })
            if (news[1].moreResults == "NO_MORE_RESULTS") {
                endNews = true;
            }
            postingNews(news)
            requisiting = false
        }
    } catch (error) {
        plotConsole(error)
        requisiting = false
    }
}

async function cloudComputing(someURl) {
    plotConsole(`Getting from: ${someURl}`)
    try {
        let postNews = await getFromCloud('robotNews', 'POST', { 'someURL': someURl, 'lang': 'pt' })
        plotConsole(postNews);
        initNews();
    } catch (error) {
        plotConsole(error)
    }
}

function sendingMessage(firstName, contact, message) {
    if (!contact) {
        window.open(encodeURI(`https://wa.me/+5585998614541?text=${message}`));
    }
}

// FB.login(async (response) => {
//     if (response.status === 'connected') {
//         plotConsole(`Getting from: ${someURl}`)
//         let response = await getFromCloud('robotText', { 'someURL': someURl, 'lang': 'pt' })
//         plotConsole(response)
//     } else {
//         plotConsole("The user is not logged into this web page or we are unable to tell.")
//     }
// }, { scope: 'instagram_basic,instagram_content_publish' });

async function postOnInstagram(bundleNews) {
    plotConsole(`Posting on Instagram...`)
    let response = await FB.getLoginStatus();
    plotConsole(`${response}`)
    console.log(response)
}

async function getFromCloud(func, method, dataIn) {
    let dataReturn;
    await $.ajax({
        'url': `${rootUrl}${func}`,
        'dataType': "json",
        'method': method,
        'crossDomain': true,
        'headers': {
            'Accept': 'application/json'
        },
        'data': dataIn,
        success: (data) => {
            dataReturn = data;
        },
        error: (request, status, error) => {
            plotConsole(status);
            plotConsole(error);
            plotConsole(request.responseText);
        }
    });
    return dataReturn;
}