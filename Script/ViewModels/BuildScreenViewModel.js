var BuildScreenViewModel = function () {
    var self = this;

    self.isFirstLoad  = ko.observable(true);
    self.builds       = ko.observableArray();
    self.buildTypes   = ko.observableArray();
    self.errorMessage = ko.observable();
    self.isLoading    = ko.observable(true);
    self.randomClass  = ko.observable(Utils.getRandomClass());
    self.mainBuild    = ko.observable();
	
	self.mostRecentBuildAndCompiles = ko.computed(function() {
		var regularBuilds = ko.utils.arrayFilter(self.builds(), function(build) {
			return build.buildTypeId() == 'CompileAndUnitTests_CompileAndBuild';
		}, self);
		
		// return array of just the first one (most recent)
		return regularBuilds.slice(0,1);
	});
	
	self.mostRecentDeploysToDev = ko.computed(function() {
		var deployToDevBuilds = ko.utils.arrayFilter(self.builds(), function(build) {
			return build.buildTypeId() == 'DeployToDevelopment_DeployToDevelopment';
		}, self);
		
		// return array of just the first one (most recent)
		return deployToDevBuilds.slice(0,1);
	});
	
	self.mostRecentDeploysToAccept = ko.computed(function() {
		var deployToAcceptBuilds = ko.utils.arrayFilter(self.builds(), function(build) {
			return build.buildTypeId() == 'DeployToAccept_DeployToAccept';
		}, self);
		
		// return array of just the first one (most recent)
		return deployToAcceptBuilds.slice(0,1);
	});
	

    self.hasError = ko.computed(function () {
        if (!this.errorMessage())
            return false;
        return this.errorMessage().length > 0;
    }, self);

    self.init = function () {
        self.isLoading(true);
        self.loadBuildTypes();
        self.loadMainBuildStatus();

        //Load a new build image every so often just for fun
        setInterval(function () { self.randomClass(Utils.getRandomClass()); }, Settings.buildImageIntervalMs);

    };

    self.loadAllBuilds = function () {
        self.isLoading(true);
        $.getJSON(Settings.buildsUrl + Utils.getTsQSParam(), function (data) {
            self.builds(ko.utils.arrayMap(data.build, function (build) {
                return new SingleBuildViewModel(build, self.buildTypes());
            }));

            if (self.builds().length == 0)
                self.errorMessage("There's no builds!? Better crack on with some work!");
            else
                self.errorMessage('');
        }).always(function () {
            self.isLoading(false);
            self.loadMainBuildStatus();
            if (Settings.enableAutoUpdate)
                setTimeout(self.loadAllBuilds, Settings.checkIntervalMs);
            if (self.isFirstLoad())
                self.isFirstLoad(false);
        });
    };

    self.loadBuildTypes = function () {
        self.isLoading(true);
        $.getJSON(Settings.buildTypesUrl, function (data) {
            self.buildTypes(data.buildType);
            self.loadAllBuilds();
            self.isLoading(false);
        });
    };

    self.loadMainBuildStatus = function () {
        self.isLoading(true);
        $.getJSON(Settings.buildStatusUrl + Utils.getTsQSParam(), function (data) {
            self.mainBuild(ko.mapping.fromJS(data, {
                create: function(options) {
                    return new MainBuildViewModel(options.data, self.buildTypes());
                }
            }));
        }).always(function (){
            self.isLoading(false);
        });
    };

    self.init();
};
