function serverConfig() {
    this.db = new function () {
        this.host = '127.0.0.1';
        this.port = 3306;
        this.user = '';
        this.password = '';
        this.dbname = '';
        this.charset = 'utf8mb4';
        this.table_prefix = '';
        this.chat_table_prefix = 'chat_';
    }();
    this.port = new function () {
        this.port = 8032;
    }();
    this.crypto = new function () {
        this.algorithm = 'aes-256-ctr';
        this.length = 16;
        this.salt = 'Osdasds/nSdwNlyAS/dwsdCasdAHat==';
        this.byte = 16;
    }();
    this.salt = new function () {
        this.time = 90831;
        this.byte = 64;
        this.type = 'base64';
        this.hash = 'sha512';
        this.hashkey = "asdwagasgasgahwawsaxczgzdgasegewgewrqweqweqweqwdasd";
    }();
    this.ssl = new function () {
        this.ssl = false;
        this.key = "key.pem";
        this.cert = "crt.pem";
        this.ca = "ca-chain-bundle.pem";
    }();
    this.cors = new function () {
        this.domain = "*";
    }();
}

module.exports = new serverConfig();