angular.module('OrderCloud-LargeAddressListSearch', []);

angular
	.module('OrderCloud-LargeAddressListSearch')
	.directive('largeshipaddresssearch', largeshipaddresssearch)
	.controller('LargeShipAddressSearchCtrl', LargeShipAddressSearchCtrl)
	.directive('largebilladdresssearch', largebilladdresssearch)
	.controller('LargeBillAddressSearchCtrl', LargeBillAddressSearchCtrl)
	.factory('LargeAddressList', LargeAddressList);

function largeshipaddresssearch() {
	var directive = {
		restrict: 'E',
		controller: 'LargeShipAddressSearchCtrl',
		template: template,
	};
	return directive;

	function template() {
		return [
			'<form class="uk-form uk-form-width-1-1">',
			'<div class="uk-inline uk-width-1-1">',
			'<div>',
			'<input class="uk-input uk-form-width-medium" type="text" id="patient-id" ng-model="shipAddressSearchText" ng-change="resetForm()" placeholder="Patient ID" value="" required autocomplete="off" autofocus />',
			'<button class="uk-button uk-button-primary" ng-click="searchForPatientAddress(shipAddressSearchText)" ng-model="shipAddressSearchText">Search</button>',
			'</div>',
			'</div>',
			'</form>',
		].join('');
	}
}

LargeShipAddressSearchCtrl.$inject = ['$scope', '$rootScope', 'AddressList', 'LargeAddressList', 'Address', 'Order'];
function LargeShipAddressSearchCtrl($scope, $rootScope, AddressList, LargeAddressList, Address, Order) {
	AddressList.shipping(function (list) {
		$scope.shipAddressesArray = list;
		$scope.readonlyshipping = false;
		if ($scope.shipAddressesArray.length == 1) {
			$scope.ShipAddressID = list[0].ID;
			$scope.ShipAddress = list[0];
			$scope.shipAddress = list[0];
			$scope.orderShipAddress = list[0];
			$scope.readonlyshipping = true;
		} else {
			$scope.shipAddressesArray = [' '];
		}
	});
	console.log('LargeShipAddressSearchCtrl');
	$scope.shipAddressSearchText = '';
	$scope.orderShipAddress = '';
	$scope.shipAddressCount = null;
	$scope.showNewAddress = false;
	$scope.showAddressButtons = false;
	$scope.showOrderConfirmationButtons = false;
	$scope.showResult = false;
	$scope.shipaddressform = false;
	$scope.editingAddress = false;

	$scope.$watch('ShipAddress', function (newValue) {
		if (!newValue || !newValue.ID) {
			$scope.orderShipAddress = {};
			$scope.currentOrder.ShipAddressID = null;
			$scope.showNewAddress = false;
			$scope.showResult = false;
		} else {
			$scope.orderShipAddress = newValue;
			$scope.currentOrder.ShipAddress = newValue;
			if ($scope.currentOrder) {
				$scope.currentOrder.ShipAddressID = newValue.ID;
				$scope.currentOrder.ShipFirstName = null;
				$scope.currentOrder.ShipLastName = null;
				angular.forEach($scope.currentOrder.LineItems, function (item) {
					item.ShipFirstName = null;
					item.ShipLastName = null;
				});
			}
			if (newValue) {
				if ($scope.user.Permissions.contains('EditShipToName') && !$scope.orderShipAddress.IsCustEditable) {
					angular.forEach($scope.currentOrder.LineItems, function (item) {
						item.ShipFirstName = $scope.orderShipAddress.FirstName;
						item.ShipLastName = $scope.orderShipAddress.LastName;
					});
				}
				$scope.setShipAddressAtOrderLevel();
			}
		}
		//account for New Address
		$scope.$on('event:AddressSaved', function (event, address) {
			if (address.IsShipping) {
				$scope.ShipAddress = address;
			}
		});
	});

	$scope.resetForm = function () {
		console.log('resetForm()');
		$scope.shipAddressObject = null;
		$scope.shipAddressesArray = [];
		$scope.orderShipAddress = '';
		$scope.showAddressButtons = false;
		$scope.showNewAddress = false;
		$scope.shipAddressCount = null;
		$scope.editingAddress = false;
	};

	$scope.searchForPatientAddress = function (searchTerm) {
		console.log('searchForPatientAddress()', searchTerm);
		$scope.editingAddress = false;
		$scope.showNewAddress = false;
		$scope.showAddressButtons = false;
		$scope.showOrderConfirmationButtons = false;
		$scope.shipAddressesArray = [' ']; //this sets shipAddressesArray to something while we wait for the search so we don't have to modify existing ng-show/hide(s) for address form / ship method
		LargeAddressList.queryShipping(searchTerm, function (list, count) {
			if (count > 0) {
				console.log('count > 0');
				$scope.shipAddressCount = 0;
				for (let i = 0; i < count; i++) {
					if (list[i].AddressName === searchTerm) {
						$scope.shipAddressesArray = list;
						$scope.shipAddressCount = 1;
					}
				}
			}

			if ($scope.shipAddressCount === null || $scope.shipAddressCount === 0) {
				$scope.orderShipAddress = {};
				$scope.currentOrder.ShipAddressID = null;
				$scope.shipAddressObject = {
					PatientID: searchTerm,
					CompanyName: '',
					Country: 'GB',
					IsBilling: false,
					IsShipping: true,
					IsCustEditable: true,
				};
				$scope.showNewAddress = true;
				$scope.showResult = false;
				$scope.showOrderConfirmationButtons = false;

				UIkit.modal(document.getElementById('address-modal')).show();
			} else {
				$scope.orderShipAddress = searchTerm;
				$scope.currentOrder.ShipAddress = searchTerm;
				$scope.shipAddressObject = $scope.shipAddressesArray[0];
				$scope.shipAddressObject.PatientID = searchTerm;
				$scope.shipAddressObject.IsEditing = false;
				if ($scope.currentOrder) {
					$scope.currentOrder.ShipAddressID = $scope.shipAddressesArray[0].ID;
					$scope.currentOrder.ShipFirstName = null;
					$scope.currentOrder.ShipLastName = null;
					angular.forEach($scope.currentOrder.LineItems, function (item) {
						item.ShipFirstName = null;
						item.ShipLastName = null;
					});
				}
				if (searchTerm) {
					if ($scope.user.Permissions.contains('EditShipToName') && !$scope.orderShipAddress.IsCustEditable) {
						angular.forEach($scope.currentOrder.LineItems, function (item) {
							item.ShipFirstName = $scope.orderShipAddress.FirstName;
							item.ShipLastName = $scope.orderShipAddress.LastName;
						});
					}
					$scope.setShipAddressAtOrderLevel();
					$scope.showOrderConfirmationButtons = false;
					$scope.showAddressButtons = true;
				}
				$scope.showResult = true;
			}
		});

		//account for New Address
		$scope.$on('event:AddressSaved', function (event, address) {
			if (address.IsShipping) {
				$scope.ShipAddress = address;
			}
			$scope.showNewAddress = false;
		});
	};

	$scope.searchShipAddresses = function (searchTerm) {
		$scope.showNewAddress = false;
		$scope.shipAddressesArray = [' ']; //this sets shipAddressesArray to something while we wait for the search so we don't have to modify existing ng-show/hide(s) for address form / ship method
		if (searchTerm) {
			LargeAddressList.queryShipping(searchTerm, function (list, count) {
				$scope.shipAddressesArray = list;
				$scope.shipAddressCount = count; // we will use count to add a filter for the user
				if (count === 0) {
					$scope.showResult = false;
				} else {
					$scope.showResult = true;
				}
			});
		}
	};

	if ($scope.currentOrder !== null && $scope.currentOrder.ShipAddressID) {
		Address.get($scope.currentOrder.ShipAddressID, function (add) {
			$scope.ShipAddress = add;
		});
	}
}

function editaddress() {
	console.log('editAddress LargeAddressListSearch');
}

function confirmaddress() {
	console.log('confirmAddress LargeAddressListSearch');
}

function largebilladdresssearch() {
	var directive = {
		restrict: 'E',
		controller: 'LargeBillAddressSearchCtrl',
		template: template,
	};
	return directive;

	function template() {
		return [
			'<div class="row largeaddress view-form-icon" ng-show="!copyShipAddress">',
			'	<div class="col-xs-12">',
			'		<label class="required">{{("Billing" | r) + " " + ("Address" | r) | xlat}}',
			'			<span class="count" ng-show="showBillTip">( Start typing to find your address )</span>',
			'			<span class="count" ng-show="showBillResult">No addresses found!</span>',
			'		</label>',
			'		<div class="form-group">',
			"			<input class=\"form-control\" type=\"text\" ng-model=\"BillAddress\" ng-readonly=\"readonlybilling\" required ng-change=\"searchBillAddresses(BillAddress)\" typeahead-min-length=\"3\" typeahead=\"address as (address.AddressName + ' ' + (address.FirstName || '') + ' ' + (address.LastName || '') + ' ' + (address.Street1 || '') + ' ' + (address.Street2 || '') + ' ' + (address.City || '') + ' ' + (address.State || '') + ' ' + (address.Zip || '')) for address in billaddresses | filter:$viewValue | limitTo:50\" />",
			'			<i class="fa fa-map-marker"></i>',
			'		</div>',
			'	</div>',
			'</div>',
		].join('');
	}
}

LargeBillAddressSearchCtrl.$inject = ['$scope', 'AddressList', 'LargeAddressList', 'Address'];
function LargeBillAddressSearchCtrl($scope, AddressList, LargeAddressList, Address) {
	AddressList.billing(function (list) {
		$scope.billaddresses = list;
		$scope.readonlybilling = false;
		if ($scope.billaddresses.length == 1) {
			$scope.BillAddressID = list[0].ID;
			$scope.BillAddress = list[0];
			$scope.readonlybilling = true;
		} else {
			$scope.billaddresses = [' '];
		}
	});

	$scope.billaddressform = false;
	$scope.billAddressCount = null;
	$scope.showBillTip = true;
	$scope.showBillResult = false;

	$scope.$watch('BillAddress', function (newValue) {
		if (!newValue || !newValue.ID) {
			$scope.BillAddressID = null;
			$scope.currentOrder.BillAddressID = null;
			$scope.showBillTip = true;
			$scope.showBillResult = false;
		} else {
			if ($scope.currentOrder) {
				$scope.currentOrder.BillAddress = newValue;
				$scope.currentOrder.BillAddressID = newValue.ID;
				$scope.BillAddressID = newValue.ID;
				$scope.BillAddress = newValue;
			}
		}
		//account for New Address
		$scope.$on('event:AddressSaved', function (event, address) {
			if (address.IsBilling) {
				$scope.BillAddress = address;
			}
		});
	});

	$scope.searchBillAddresses = function (searchTerm) {
		if (searchTerm && searchTerm.length > 2) {
			$scope.billaddresses = [' '];
			$scope.billAddressCount = null;
			LargeAddressList.queryBilling(searchTerm, function (list, count) {
				$scope.billaddresses = list;
				$scope.billAddressCount = count; // we will use count to add a filter for the user
				if (count === 0) {
					$scope.showBillTip = false;
					$scope.showBillResult = true;
				} else {
					$scope.showBillTip = true;
					$scope.showBillResult = false;
				}
			});
		}
	};

	if ($scope.currentOrder.BillAddressID) {
		Address.get($scope.currentOrder.BillAddressID, function (add) {
			$scope.BillAddress = add;
		});
	}
}

LargeAddressList.$inject = ['$resource', '$451'];
function LargeAddressList($resource, $451) {
	var service = {
		queryShipping: _queryShipping,
		queryBilling: _queryBilling,
	};
	return service;

	function _queryShipping(searchTerm, success) {
		$resource($451.api('address/shipping'))
			.get({ key: searchTerm, page: 1, pagesize: 100 })
			.$promise.then(function (list) {
				success(list.List, list.Count);
			});
	}

	function _queryBilling(searchTerm, success) {
		$resource($451.api('address/billing'))
			.get({ key: searchTerm, page: 1, pagesize: 100 })
			.$promise.then(function (list) {
				success(list.List, list.Count);
			});
	}
}
