import fetch from "../util/fetch-fill";
import URI from "urijs";

//records endpoint
window.path = "http://localhost:3000/records";

const primaryColors = ["red","blue","yellow"],
      itemLimit = 10;

const retrieve = (options) => {
  const endpoint = window.path;

  try{
    var page = getPage(options);
    let query = buildQuery(options, page);
    var url = buildURL(endpoint,query);
  } catch(error) {
    console.log("Failed to build url. Error: " + error);
  }

  // return promise
  return fetch(url)
        .then(response => {
          if (isValidResponse(response)) {
            return response.json();
          }
        })
        .then((data) => {
          return buildResponse(data, page);
        })
        .catch((error) => {
          console.log("Error: " + error);
          return {
            ids: [],
            open: [],
            closedPrimaryCount:0,
            previousPage: null,
            nextPage: null
          };
        });
};

/* 
*  Region: URL Request Helpers
*/

// build and return query object
const buildQuery = (options, page) => {
  let settings = {
    limit: itemLimit + 1,
    offset: 0,
    'color[]': []
  };

  if (options) {
    settings.limit = (typeof options.limit !== 'undefined' && options.limit > 0) ? (options.limit + 1) : (itemLimit + 1);
    settings.offset = (typeof options.page !== 'undefined' && options.page > 1) ? getOffset(settings.limit-1,page) : 0;
    settings["color[]"] = (typeof options.colors !== 'undefined' && options.colors.length > 0) ? options.colors : [];
  }

  return settings;
};

// return URL request
const buildURL = (endpoint, options) => {
  let url = new URI(endpoint).setSearch(options);
  return url;
};

// check if response from endpoint is valid
const isValidResponse = (response) => {
  return (response.ok && (!(response.err))) ? true : false;
};

/* 
*  End of Region: URL Request Helpers
*/

/* 
*  Region: Response Helpers
*/

// build and return response object
const buildResponse = (data, page) => {
  let dataLength = data.length;
  let isMorePages = false;
  let response = {
    ids: [],
    open: [],
    closedPrimaryCount:0,
    previousPage: null,
    nextPage: null
  }
  try{
    if(dataLength > 0){
      if (dataLength > 10) {
        isMorePages = true;
        data.pop();
      }

      data = pushIsPrimaryKey(data);
      response.ids = getIdCollection(data) ;
      response.open = getOpenDispositionCollection(data);
      response.closedPrimaryCount = getClosedPrimaryCollection(data).length;
    }

    response.previousPage = getPreviousPage(page);
    response.nextPage = getNextPage(page, isMorePages);
  } catch(error) {
    console.log("Failed to build response. Error: " + error);
  }
  
  return response;
};

// return primary color boolean
const isPrimaryColor = (color) => {
  return primaryColors.includes((color).toLowerCase());
};

// add isPrimary key to records
const pushIsPrimaryKey = (data) => {
  data.map(item => {
    item.isPrimary = isPrimaryColor(item.color);
  });

  return data;
};

// return id collection
const getIdCollection = (data) => {
  return data.map((item) => (item.id));
};

// return open disposition collection 
const getOpenDispositionCollection = (data) => {
  return data.filter(item => (item.disposition).toLowerCase() === "open");
};

// return closed disposition collection where item colors are primary
const getClosedPrimaryCollection = (data) => {
  return data.filter(item => (item.disposition).toLowerCase() === "closed" && item.isPrimary == true);
};

/* 
*  End of Region: Response Helpers
*/

/* 
*  Region: Page Helpers
*/

// return current page
const getPage = (options) => {
  if(options){
    if(typeof options.page !== 'undefined' && options.page > 1){
      return options.page;
    }else {
      return 1;
    }
  } else {
    return  1;
  }
};

// return item offset
const getOffset = (limit, page) => {
  return limit * (page - 1);
};

// get previous page
const getPreviousPage = (page) => {
  return page === 1 ? null : page - 1;
}

// get next page
const getNextPage = (page, isMorePages) => {
  return (isMorePages) ? page + 1 : null;
}

/* 
*  End of Region: Page Helpers
*/


export default retrieve;