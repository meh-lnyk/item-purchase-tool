public class UnsplashService {
    private static final String BASE_URL = 'https://api.unsplash.com/search/photos';
    private static String getAPIKey() {
        return UnsplashConfig__c.getOrgDefaults().APIKey__c;
    }

    public static String fetchImageUrl(String query) {
        String encodedQuery = EncodingUtil.urlEncode(query, 'UTF-8');
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(BASE_URL + '?query=' + encodedQuery + '&per_page=1');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Client-ID ' + getAPIKey());

        HttpResponse res = http.send(req);
        if (res.getStatusCode() == 200) {
            UnsplashResult data = (UnsplashResult)JSON.deserialize(res.getBody(), UnsplashResult.class);
            if (!data.results.isEmpty()) {
                return data.results[0].urls.regular;
            }
        }
        return null;
    }
}
