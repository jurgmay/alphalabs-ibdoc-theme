four51.app.controller('ProductCtrl', [
	'$scope',
	'$routeParams',
	'$route',
	'$location',
	'$451',
	'Product',
	'ProductDisplayService',
	'Order',
	'Variant',
	'User',
	function ($scope, $routeParams, $route, $location, $451, Product, ProductDisplayService, Order, Variant, User) {
		$scope.isEditforApproval = $routeParams.orderID && $scope.user.Permissions.contains('EditApprovalOrder');
		if ($scope.isEditforApproval) {
			Order.get($routeParams.orderID, function (order) {
				$scope.currentOrder = order;
			});
		}

		console.log('ProductCtrl.js');
		console.log($scope);

		$scope.currentOrder = {};
		$scope.currentOrder.LineItems = [];

		$scope.orderShipAddress = '';
		$scope.shipAddress = '';
		$scope.selected = 1;
		$scope.LineItem = {};
		$scope.addToOrderText = 'Add To Order';
		$scope.loadingIndicator = false;
		$scope.loadingImage = true;
		$scope.searchTerm = null;
		$scope.settings = {
			currentPage: 1,
			pageSize: 10,
		};

		$scope.calcVariantLineItems = function (i) {
			$scope.variantLineItemsOrderTotal = 0;
			angular.forEach($scope.variantLineItems, function (item) {
				$scope.variantLineItemsOrderTotal += item.LineTotal || 0;
			});
		};
		function setDefaultQty(lineitem) {
			if (lineitem.PriceSchedule && lineitem.PriceSchedule.DefaultQuantity !== 0) $scope.LineItem.Quantity = lineitem.PriceSchedule.DefaultQuantity;
		}

		function init(searchTerm, callback) {
			console.log('init', searchTerm);
			ProductDisplayService.getProductAndVariant(
				$routeParams.productInteropID,
				$routeParams.variantInteropID,
				function (data) {
					$scope.LineItem.Product = data.product;
					$scope.LineItem.Variant = data.variant;
					ProductDisplayService.setNewLineItemScope($scope);
					ProductDisplayService.setProductViewScope($scope);

					setDefaultQty($scope.LineItem);
					$scope.$broadcast('ProductGetComplete');
					$scope.loadingIndicator = false;
					$scope.setAddToOrderErrors();
					if (angular.isFunction(callback)) callback();
				},
				$scope.settings.currentPage,
				$scope.settings.pageSize,
				searchTerm
			);
		}

		$scope.$watch('settings.currentPage', function (n, o) {
			if (n != o || (n == 1 && o == 1)) init($scope.searchTerm);
		});

		$scope.searchVariants = function (searchTerm) {
			console.log('$scope.searchVariants');
			$scope.searchTerm = searchTerm;
			$scope.settings.currentPage == 1 ? init(searchTerm) : ($scope.settings.currentPage = 1);
		};

		$scope.deleteVariant = function (v, redirect) {
			console.log('$scope.deleteVariant');
			if (!v.IsMpowerVariant) return;
			// doing this because at times the variant is a large amount of data and not necessary to send all that.
			var d = {
				ProductInteropID: $scope.LineItem.Product.InteropID,
				InteropID: v.InteropID,
			};
			Variant.delete(
				d,
				function () {
					redirect ? $location.path('/product/' + $scope.LineItem.Product.InteropID) : $route.reload();
				},
				function (ex) {
					if ($scope.lineItemErrors.indexOf(ex.Message) == -1) $scope.lineItemErrors.unshift(ex.Message);
					$scope.showAddToCartErrors = true;
				}
			);
		};

		$scope.addToOrder = function () {
			console.log('addToOrder');
			if ($scope.lineItemErrors && $scope.lineItemErrors.length) {
				$scope.showAddToCartErrors = true;
				return;
			}
			if (!$scope.currentOrder) {
				$scope.currentOrder = {};
				$scope.currentOrder.LineItems = [];
			}
			if (!$scope.currentOrder.LineItems) $scope.currentOrder.LineItems = [];

			if ($scope.currentOrder.LineItems) {
				console.log('Deleting order', $scope.currentOrder);

				Order.delete(
					$scope.currentOrder,
					function () {
						$scope.currentOrder = {};
						$scope.currentOrder.LineItems = [];
					},
					function (ex) {
						console.log('Error: ', ex);
					}
				);

				console.log('Deleted order');
			}

			if ($scope.allowAddFromVariantList) {
				angular.forEach($scope.variantLineItems, function (item) {
					if (item.Quantity > 0) {
						$scope.currentOrder.LineItems.push(item);
						$scope.currentOrder.Type = item.PriceSchedule.OrderType;
					}
				});
			} else {
				if ($scope.currentOrder.LineItems.length === 0) {
					$scope.currentOrder.LineItems.push($scope.LineItem);
					$scope.currentOrder.Type = $scope.LineItem.PriceSchedule.OrderType;
				}
			}

			$scope.addToOrderIndicator = false;

			Order.save(
				$scope.currentOrder,
				function (o) {
					$scope.user.CurrentOrderID = o.ID;
					User.save($scope.user, function () {
						$scope.addToOrderIndicator = false;
						$location.path('checkout');
					});
				},
				function (ex) {
					$scope.addToOrderIndicator = false;
					$scope.lineItemErrors.push(ex.Detail);
					$scope.showAddToCartErrors = true;
					//$route.reload();
				}
			);
		};

		$scope.setOrderType = function (type) {
			console.log('$scope.setOrderType');
			$scope.loadingIndicator = false;
			$scope.currentOrder = { Type: type };
			init(null, function () {
				$scope.loadingIndicator = false;
			});
		};

		$scope.showErrorModal = function () {
			return true;
		};

		$scope.$on('event:imageLoaded', function (event, result) {
			console.log('event:imageLoaded');
			$scope.loadingImage = false;
			$scope.$apply();
			$scope.addToOrder();
		});
	},
]);
