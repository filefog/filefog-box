var transform = {};

transform.accountInfo = function(account_response){

    var transform = {};
    transform.name = account_response.name;
    transform.email = account_response.login;
    transform.avatar_url = account_response.avatar_url;
    transform.created_date = new Date(account_response.created_at);
    transform.modified_date = new Date(account_response.modified_at);
    transform.id = account_response.id;
    transform._raw = account_response;
    return transform;
};

transform.checkQuota = function (quota_response){

    var transform = {};
    transform.total_bytes = quota_response.space_amount; //total space allocated in bytes
    transform.used_bytes = quota_response.space_used; //bytes used.
    transform.limits= {
        upload_size : quota_response.max_upload_size
    }
    transform._raw = quota_response;
    return transform;
};

transform.createFile = function(create_response){
    var self = this;
    if(create_response.total_count >=1){
        return self.getFileInformation(create_response.entries[0])
    }
    else{
        throw new Error("File was not created.")
    }
};

transform.deleteFile = function(deletion_response){
    var transform = {};
    transform.success = true;
    transform._raw = deletion_response;
    return transform;
};

transform.downloadFile = function(download_response){
    return download_response
};

transform.getFileInformation = function (file_response){
    var transform = {};
    transform.is_file = true;
    transform.is_folder = false;
    transform.etag = file_response.etag;
    transform.identifier = file_response.id;
    transform.parent_identifier = (file_response.parent ? file_response.parent.id : null);
    transform.mimetype = ""
    transform.created_date = new Date(file_response.created_at);
    transform.modified_date = new Date(file_response.modified_at);
    transform.name = file_response.name;
    transform.description = file_response.description;
    //transform.extension = file_response.name.split('.')
    transform.checksum = file_response.sha1;
    transform.file_size = file_response.size;
    transform._raw = file_response;
    return transform;
};

//transform.createFolder = function(create_response){
//    console.log("CREATE FOLDER OUTPUT", create_response)
//    var transform = {};
//    transform.success = true;
//    transform._raw = create_response;
//    return transform;
//};

transform.deleteFolder = function(deletion_response){
    var transform = {};
    transform.success = true;
    transform._raw = deletion_response;
    return transform;
};


transform.getFolderInformation = function(folder_response){
    var transform = {};
    transform.is_file = false;
    transform.is_folder = true;
    transform.etag = folder_response.etag;
    transform.identifier = folder_response.id;
    transform.parent_identifier = (folder_response.parent? folder_response.parent.id : null);
    transform.created_date = new Date(folder_response.created_at);
    transform.modified_date = new Date(folder_response.modified_at);
    transform.name = folder_response.name;
    transform.description = folder_response.description;
    transform._raw = folder_response;
    return transform;
};


transform.retrieveFolderItems = function(items_response){
    /*
     "total_count": 0,
     "entries": [],
     "offset": 0,
     "limit": 100,
     "order": [
     {
     "by": "type",
     "direction": "ASC"
     },
     {
     "by": "name",
     "direction": "ASC"
     }
     ]
     * */
    var self = this;
    var transform = {};
    transform.total_items = items_response.total_count;
    transform.content = items_response.entries.map(function(current_item){
        if(current_item.type == "file"){
            return self.getFileInformation(current_item);
        }
        else{
            return self.getFolderInformation(current_item);
        }
    });
    return transform;
};
///////////////////////////////////////////////////////////////////////////////
// Aliases
transform.createFolder = transform.getFolderInformation;



///////////////////////////////////////////////////////////////////////////////
// Event transforms


transform.eventUpsert = function(event){
    var self = this;
    var item ={};

    if(event.source.type == "file"){
        item = self.getFileInformation(event.source);
    }
    else{
        item = self.getFolderInformation(event.source);
    }
    item.event_type = "upsert";
    return item;
}

transform.eventDelete = function(event){
    return {
        event_type: "delete",
        identifier: event.source.id
    }
}

transform.events = function(events_response){
    var self = this;
    var transform = {};
    transform.next_cursor = events_response.next_stream_position;
    transform.events = events_response.entries.reduce(function(feed, event){
        if(event.event_type == "ITEM_CREATE" ||
            event.event_type == "ITEM_UPLOAD" ||
            event.event_type == "ITEM_COPY" ||
            event.event_type == "ITEM_MOVE" ||
            event.event_type == "ITEM_UNDELETE_VIA_TRASH" ||
            event.event_type == "ITEM_RENAME"){
            feed.push(self.eventUpsert(event))
        }
        else if(event.event_type == "ITEM_TRASH"){
            feed.push(self.eventDelete(event))
        }
        return feed;
    },[])
    transform._raw = events_response;
    return transform;
}


///////////////////////////////////////////////////////////////////////////////
// OAuth transforms

transform.oAuthGetAccessToken = function(token_response){
    var transform = {};
    transform.access_token = token_response.access_token;
    transform.refresh_token = token_response.refresh_token;
    //calculate expiry
    var expiration_utc_timestamp = (new Date().getTime()) + (1000 * token_response.expires_in);
    transform.expires_on = (new Date(expiration_utc_timestamp)).toISOString();
    transform._raw = token_response;
    return transform;
}

transform.oAuthRefreshAccessToken = function(token_response){
    var transform = {};
    transform.access_token = token_response.access_token;
    transform.refresh_token = token_response.refresh_token;
    transform._raw = token_response;
    return transform;
}

module.exports = transform;
