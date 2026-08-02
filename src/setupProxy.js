const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // רק נתיבים שמתחילים ב-/submit או /api או /get ילכו לשרת
    app.use(
        ['/submit-form1', '/submit-form2', '/submit-form3', '/submit-personal-info', '/submit-meet-your-pain', '/get-latest-form1-id', '/api'],
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
            secure: false,
            pathRewrite: function (path, req) {
                return path;
            }
        })
    );
};