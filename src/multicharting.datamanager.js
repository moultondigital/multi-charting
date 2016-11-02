var	dataStore = {},
	linkStore = {},
	idCount = 0,
	// Constructor class for dataManager.
	dataManager = function (JSONData, id) {
    	var manager = this;
    	manager.addData(JSONData, id);
	},
	proto = dataManager.prototype,

	//Function to update all the linked child data
	updataData = function (id) {
		var i,
			linkData = linkStore[id],
			parentData = dataStore[id],
			len,
			linkIds,
			filters,
			linkId,
			filter,
			info;

		linkIds = linkData.link;
		filters = linkData.filter;
		len = linkIds.length;

		for (i = 0; i < len; i++) {
			linkId = linkIds[i];
			filter = filters[i].getFilter();

			if (typeof filter === 'function') {
				dataStore[linkId] = filter(parentData);
			}
			
			if (linkStore[linkId]) {
				updataData(linkId);
			}
		}
	};

// Function to add data in the data store
proto.addData = function (JSONData, id) {
	var data = this,
		oldId = data.id,
		oldJSONData = dataStore[oldId] || [];

	id = oldId || id || 'dataStore' + idCount ++;
	dataStore[id] = oldJSONData.concat(JSONData || []);

	data.id = id;

	if (linkStore[id]) {
		updataData(id)
	}
	dispatchEvent(new CustomEvent('dataAdded', {'detail' : {
		'id': id,
		'data' : JSONData
	}}));
};

// Function to get data from the data store after applying filters
proto.getData = function (filters) {
	var data = this,
		id = data.id;
	// If no parameter is present then return the unfiltered data.
	if (!filters) {
		return dataStore[id];
	}
	// If parameter is an array of filter then return the filtered data after applying the filter over the data.
	else if (filters instanceof Array) {
		let result = [],
			i,
			newData,
			linkData,
			newId,
			filter,
			len = filters.length;

		for (i = 0; i < len; i++) {
			filter = filters[i].getFilter();

			if (typeof filter === 'function') {
				newData = filters[i](dataStore[id]);
				newDataObj = new dataManager(newData);
				newId = newDataObj.id;

				dataStore[newId] = newData;
				result.push(newDataObj);

				//Pushing the id of child class in the parent classes.
				linkData = linkStore[id] || (linkStore[id] = {
					link : [],
					filter : []
				});
				linkData.link.push(newId);
				linkData.filter.push(filters[i]);

				// setting the current id as the newID so that the next filter is applied on the child data;
				id = newId;
			}
		}
		return result;
	}
};

// Function to delete the current data from the datastore and also all its childs recursively
proto.deleteData = function (optionalId) {
	var data = this,
		id = optionalId || data.id,
		linkData = linkStore[id],
		flag;

	if (linkData) {
		let i,
			link = linkData.link,
			len = link.length;
		for (i = 0; i < len; i ++) {
			data.deleteData(link[i]);
		}
		delete linkStore[id];
	}

	flag = delete dataStore[id];
	dispatchEvent(new CustomEvent('dataDeleted', {'detail' : {
		'id': id,
	}}));
	return flag;
};

// Function to get the id of the current data
proto.getID = function () {
	return this.id;
};

// Function to modify data
proto.modifyData = function (JSONData) {
	var data = this,
		id = data.id;

	dataStore[id] = [];
	data.addData(JSONData, id);
	dispatchEvent(new CustomEvent('dataModified', {'detail' : {
		'id': id,
		'data' : JSONData
	}}));
};