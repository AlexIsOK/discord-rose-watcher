
class RequestObject {
    
    constructor(data, endpoint) {
        this.data = data;
        this.endpoint = endpoint;
    }
    
    getData() {
        return this.data;
    }
    
    getEndpoint() {
        return this.endpoint;
    }
    
}

module.exports = {
    RequestObject
}
