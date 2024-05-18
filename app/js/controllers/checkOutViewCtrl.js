four51.app.controller('CheckOutViewCtrl', [
	'$scope',
	'$routeParams',
	'$location',
	'$filter',
	'$rootScope',
	'$451',
	'User',
	'Order',
	'OrderConfig',
	'FavoriteOrder',
	'AddressList',
	'GoogleAnalytics',
	function ($scope, $routeParams, $location, $filter, $rootScope, $451, User, Order, OrderConfig, FavoriteOrder, AddressList, GoogleAnalytics) {
		$scope.errorSection = 'open';

		if (!$scope.currentOrder) {
			$location.path('catalog');
		}

		$scope.orderShipAddress = null;
		$scope.shipAddress = null;
		$scope.shipAddressCount = null;
		$scope.showNewAddress = false;
		$scope.showAddressButtons = false;
		$scope.showOrderConfirmationButtons = false;
		$scope.showResult = false;
		$scope.shipaddressform = false;
		$scope.editingAddress = false;

		console.log('CheckOutViewCtrl.js');
		console.log($scope);

		$scope.hasOrderConfig = OrderConfig.hasConfig($scope.currentOrder, $scope.user);
		$scope.checkOutSection = $scope.hasOrderConfig ? 'order' : 'shipping';

		function submitOrder() {
			$scope.displayLoadingIndicator = false;
			$scope.submitClicked = true;
			$scope.errorMessage = null;
			$scope.currentOrder.ShipAddress = $scope.shipAddressObject;

			saveToGroupAddressBook($scope.shipAddressObject);

			Order.submit(
				$scope.currentOrder,
				function (data) {
					$scope.user.CurrentOrderID = null;
					User.save($scope.user, function (data) {
						$scope.user = data;
						$scope.displayLoadingIndicator = false;
					});
					$scope.currentOrder = null;
					$location.path('/order/new/' + data.ID);
				},
				function (ex) {
					$scope.submitClicked = false;
					$scope.errorMessage = ex.Message;
					$scope.displayLoadingIndicator = false;
					$scope.shippingUpdatingIndicator = false;
					$scope.shippingFetchIndicator = false;
				}
			);
		}

		function saveToGroupAddressBook(addressObj) {
			const companyInteropID = $rootScope.$$childHead.user.CustomFields[0].DefaultValue;
			const addressJson = JSON.stringify({
				GroupInteropID: 'MAIN-GROUP',
				Addresses: [
					{
						AddressProperties: {
							InteropID: 'ADDR-' + addressObj.PatientID,
							CompanyInteropID: companyInteropID,
							AddressName: addressObj.PatientID,
							FirstName: addressObj.FirstName,
							LastName: addressObj.LastName,
							CompanyName: addressObj.CompanyName,
							AddressLine1: addressObj.Street1,
							AddressLine2: addressObj.Street2,
							City: addressObj.City,
							State: addressObj.State,
							Zip: addressObj.Zip,
							Country: 'GB',
							Phone: '',
						},
					},
				],
			});

			const url = 'https://egqmyi45zp7j2evykymvbrefz40jrunq.lambda-url.eu-west-2.on.aws/';
			const xhr = new XMLHttpRequest();
			xhr.open('POST', url, true);
			xhr.setRequestHeader('content-type', 'application/json');
			xhr.send(addressJson);

			xhr.onreadystatechange = () => {
				// Call a function when the state changes.
				if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
					// Request finished. Do processing here.
				}
			};
		}

		$scope.$watch('currentOrder.CostCenter', function () {
			OrderConfig.address($scope.currentOrder, $scope.user);
		});

		function saveChanges(callback) {
			$scope.displayLoadingIndicator = false;
			$scope.errorMessage = null;
			$scope.actionMessage = null;
			var auto = $scope.currentOrder.autoID;
			Order.save(
				$scope.currentOrder,
				function (data) {
					$scope.currentOrder = data;
					if (auto) {
						$scope.currentOrder.autoID = true;
						$scope.currentOrder.ExternalID = 'auto';
					}
					$scope.displayLoadingIndicator = false;
					if (callback) callback($scope.currentOrder);
					$scope.actionMessage = 'Your changes have been saved';
				},
				function (ex) {
					$scope.currentOrder.ExternalID = null;
					$scope.errorMessage = ex.Message;
					$scope.displayLoadingIndicator = false;
					$scope.shippingUpdatingIndicator = false;
					$scope.shippingFetchIndicator = false;
				}
			);
		}

		function editAddress() {
			$scope.editingAddress = true;
			$scope.shipAddressObject.IsEditing = true;
			UIkit.modal(document.getElementById('address-modal')).show();
		}

		function confirmAddress() {
			console.log('confirmAddress()');
			$scope.showAddressButtons = false;
			$scope.showOrderConfirmationButtons = true;
		}

		$scope.continueShopping = function () {
			if (confirm('Do you want to save changes to your order before continuing?') === true)
				saveChanges(function () {
					$location.path('catalog');
				});
			else $location.path('catalog');
		};

		$scope.cancelOrder = function () {
			if (confirm('Are you sure you wish to cancel your order?') === true) {
				$scope.displayLoadingIndicator = false;
				Order.delete(
					$scope.currentOrder,
					function () {
						$scope.user.CurrentOrderID = null;
						$scope.currentOrder = null;
						User.save($scope.user, function (data) {
							$scope.user = data;
							$scope.displayLoadingIndicator = false;
							$location.path('catalog');
						});
					},
					function (ex) {
						$scope.actionMessage = ex.Message;
						$scope.displayLoadingIndicator = false;
					}
				);
			}
		};

		$scope.editAddress = function () {
			editAddress();
		};

		$scope.confirmAddress = function () {
			confirmAddress();
		};

		$scope.saveChanges = function () {
			saveChanges();
		};

		$scope.submitOrder = function () {
			submitOrder();
		};

		$scope.cancelEdit = function () {
			$location.path('order');
		};
	},
]);
