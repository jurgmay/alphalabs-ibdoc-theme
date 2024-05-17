four51.app.controller('OrderSearchCtrl', [
	'$scope',
	'$location',
	'OrderSearchCriteria',
	'OrderSearch',
	function ($scope, $location, OrderSearchCriteria, OrderSearch) {
		$scope.settings = {
			currentPage: 1,
			pageSize: 50, // Changed from default value of 10 - Juergen May 24th Feb 2016
		};

		OrderSearchCriteria.query(function (data) {
			$scope.OrderSearchCriteria = data;
			$scope.hasStandardTypes = _hasType(data, 'Standard');
			$scope.hasReplenishmentTypes = _hasType(data, 'Replenishment');
			$scope.hasPriceRequestTypes = _hasType(data, 'PriceRequest');
		});

		$scope.$watch('settings.currentPage', function () {
			Query($scope.currentCriteria);
		});

		$scope.OrderSearch = function ($event, criteria) {
			$event.preventDefault();
			$scope.currentCriteria = criteria;
			Query(criteria);
		};

		function _hasType(data, type) {
			var hasType = false;
			angular.forEach(data, function (o) {
				if (hasType || (o.Type == type && o.Count > 0)) hasType = true;
			});
			return hasType;
		}

		function Query(criteria) {
			if (!criteria) return;
			$scope.showNoResults = false;
			$scope.pagedIndicator = true;
			OrderSearch.search(
				criteria,
				function (list, count) {
					list.forEach((element) => {
						element.DateCanceled = element.DateCanceled
							? new Date(new Date(element.DateCanceled).getTime() + 360 * 60 * 1000).toISOString()
							: element.DateCanceled;
						element.DateCompleted = element.DateCompleted
							? new Date(new Date(element.DateCompleted).getTime() + 360 * 60 * 1000).toISOString()
							: element.DateCanceled;
						element.DateCreated = element.DateCreated
							? new Date(new Date(element.DateCreated).getTime() + 360 * 60 * 1000).toISOString()
							: element.DateCanceled;
						element.DateDeclined = element.DateDeclined
							? new Date(new Date(element.DateDeclined).getTime() + 360 * 60 * 1000).toISOString()
							: element.DateCanceled;
						element.DateSubmitted = element.DateSubmitted
							? new Date(new Date(element.DateSubmitted).getTime() + 360 * 60 * 1000).toISOString()
							: element.DateCanceled;
						element.DateSubmittedForApproval = element.DateSubmittedForApproval
							? new Date(new Date(element.DateSubmittedForApproval).getTime() + 360 * 60 * 1000).toISOString()
							: element.DateCanceled;
					});

					$scope.orders = list;
					$scope.settings.listCount = count;
					$scope.showNoResults = list.length == 0;
					$scope.pagedIndicator = false;
				},
				$scope.settings.currentPage,
				$scope.settings.pageSize
			);
			$scope.orderSearchStat = criteria;
		}
	},
]);
