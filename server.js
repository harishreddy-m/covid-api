const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const app = express();
const { redis, config, scraper } = require('./routes/instances');
const { keys } = config;

const execAll = async() => {
    await Promise.all([
        scraper.getWorldometerPage(keys, redis),
        scraper.getStates(keys, redis),
        scraper.jhuLocations.jhudataV2(keys, redis),
        scraper.historical.historicalV2(keys, redis),
        scraper.historical.getHistoricalUSADataV2(keys, redis)
    ]);
    app.emit('scrapper_finished');
};

execAll();
setInterval(execAll, config.interval);

app.use(cors());

const listener = app.listen(process.env.PORT || config.port, () =>
    console.log(`Your app is listening on port ${listener.address().port}`)
);

app.get('/', async(request, response) => {
    response.redirect('docs');
});

app.use('/public', express.static('assets'));
app.use('/docs',
    swaggerUi.serve,
    swaggerUi.setup(null, {
        explorer: true,
        customSiteTitle: 'COVID 19 API',
        customfavIcon: '/public/virus.png',
        customCssUrl: '/public/apidocs/custom.css',
        swaggerOptions: {
            urls: [{
                    name: 'version 2.0.0',
                    url: '/public/apidocs/swagger_v2.json'
                },
                {
                    name: 'version 1.0.0',
                    url: '/public/apidocs/swagger_v1.json'
                }
            ]
        }
    })
);

app.use(require('./routes/api_worldometers'));
app.use(require('./routes/api_historical'));
app.use(require('./routes/api_jhucsse'));
app.use(require('./routes/api_deprecated'));

module.exports = app;