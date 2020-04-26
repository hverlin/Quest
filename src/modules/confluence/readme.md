# Confluence Module

## Authentication
Only support basic auth for now.
If you don't have a username and password, you can get one usually here https://confluence.mycompany.com/forgotuserpassword.action

## Configuration
It is possible to change the filter to narrow your search.
The default CQL query is:
```
siteSearch ~ "input" and type ="page"
```

If you use a filter, it will be converted to:
```
siteSearch ~ "input" and type ="page" and ${filter}
```

## Resources
- https://developer.atlassian.com/server/confluence/confluence-rest-api-examples/
- https://developer.atlassian.com/server/confluence/advanced-searching-using-cql/
