/*
 * Directive to display a survey to add notes to a trip or place
 * 
 * Assumptions:
 * - The directive is embedded within an ion-view
 * - The controller for the ion-view has a function called
 *      'recomputeDisplayTrips` which modifies the trip *list* as necessary. An
 *      example with the label view is removing the labeled trips from the
 *      "toLabel" filter. Function can be a no-op (for example, in
 *      the diary view)
 * - The view is associated with a state which we can record in the client stats.
 * - The directive implements a `verifyTrip` function that can be invoked by
 *      other components.
 */

angular.module('emission.survey.enketo.add-note-button',
    ['emission.stats.clientstats',
        'emission.services',
        'emission.config.dynamic',
        'emission.survey.enketo.launch',
        'emission.survey.enketo.answer',
        'emission.survey.enketo.preview',
        'emission.survey.inputmatcher'])
.directive('enketoAddNoteButton', function() {
  return {
    scope: {
      trip: '=',
      notesConfig: '=',
      surveys: '=',
      timeBounds: '=',
      datakey: '@',
    },
    controller: "EnketoAddNoteButtonCtrl",
    templateUrl: 'templates/survey/enketo/add-note-button.html'
  };
})
.controller("EnketoAddNoteButtonCtrl", function($scope, $element, $attrs, $translate,
    EnketoSurveyLaunch, $ionicPopover, ClientStats, DynamicConfig,
    EnketoNotesButtonService) {
  console.log("Invoked enketo directive controller for add-note-button");
  $scope.notes = [];

  EnketoNotesButtonService.key = $scope.datakey;

  $scope.displayLabel = () => {
    const localeCode = $translate.use();
    // if already filled in
    //   return $scope.notesConfig?.['filled-in-label']?.[localeCode];
    return $scope.notesConfig?.['not-filled-in-label']?.[localeCode];
  }

  $scope.getPrefillTimes = () => {
    const timeBounds = $scope.timeBounds();
    const begin = timeBounds.start_fmt_time || timeBounds.enter_fmt_time;
    const stop = timeBounds.end_fmt_time || timeBounds.exit_fmt_time;
    return {
      "Date": moment(begin).format('YYYY-MM-DD'),
      "Start_time": moment(begin).format('HH:mm:ss.mmm'),
      "End_time": moment(stop).format('HH:mm:ss.mmm')
    }
  }

  const getScrollElement = function() {
    if (!$scope.scrollElement) {
        console.log("scrollElement is not cached, trying to read it ");
        const ionItemElement = $element.closest('ion-item')
        if (ionItemElement) {
            console.log("ionItemElement is defined, we are in a list, finding the parent scroll");
            $scope.scrollElement = ionItemElement.closest('ion-content');
        } else {
            console.log("ionItemElement is defined, we are in a detail screen, ignoring");
        }
    }
    // TODO: comment this out after testing to avoid log spew
    console.log("Returning scrollElement ", $scope.scrollElement);
    return $scope.scrollElement;
  }

  $scope.openPopover = function ($event, trip, inputType) {
    const surveyName = $scope.notesConfig.surveyName;
    console.log('About to launch survey ', surveyName);

    let isPlace = false;
    if (surveyName == 'TimeUseSurvey') {
      // The way isPlace is generated is very rudamentary, only checking to see if the datakey includes the word "place". We will want to change
      // this before pushing the final changes to a more permanent solution, but for now this at the very least works
      isPlace = $scope.datakey.includes("place");
    }

    // prevents the click event from bubbling through to the card and opening the details page
    if ($event.stopPropagation) $event.stopPropagation();
    return EnketoSurveyLaunch
      .launch($scope, surveyName, { trip: trip, prefillFields: $scope.getPrefillTimes(), dataKey: $scope.datakey })
      .then(result => {
        if (!result) {
          return;
        }

        let start_enter_time = result.jsonDocResponse.a88RxBtE3jwSar3cwiZTdn.group_hg4zz25.Date + " " + result.jsonDocResponse.a88RxBtE3jwSar3cwiZTdn.group_hg4zz25.Start_time.substr(0, 12);
        let end_exit_time = result.jsonDocResponse.a88RxBtE3jwSar3cwiZTdn.group_hg4zz25.Date + " " + result.jsonDocResponse.a88RxBtE3jwSar3cwiZTdn.group_hg4zz25.End_time.substr(0, 12);
        if (isPlace) {
          result.enter_fmt_time = moment(start_enter_time).format("LT")
          result.exit_fmt_time = moment(end_exit_time).format("LT")
        } else {
          result.start_fmt_time = moment(start_enter_time).format("LT")
          result.end_fmt_time = moment(end_exit_time).format("LT")
        }
        
        $scope.$apply(() => {
          if(isPlace) {
            if(!trip.placeAddition)
              trip.placeAddition = [];
            trip.placeAddition.push({
              data: result,
              write_ts: Date.now(),
              key: $scope.datakey
            })
          } else {
            if (!trip.tripAddition)
              trip.tripAddition = [];
            trip.tripAddition.push({
              data: result,
              write_ts: Date.now(),
              key: $scope.datakey
            });
          }
          const scrollElement = getScrollElement();
          if (scrollElement) scrollElement.trigger('scroll-resize');
        });
        // store is commented out since the enketo survey launch currently
        // stores the value as well
        // $scope.store(inputType, result, false);
      });
  };
})
.factory("EnketoNotesButtonService", function(InputMatcher, EnketoSurveyAnswer, $timeout) {
  var enbs = {};
  console.log("Creating EnketoNotesButtonService");
  enbs.SINGLE_KEY="NOTES";
  enbs.key = "manual/trip_addition_input";
  enbs.MANUAL_KEYS = [enbs.key];

  /**
   * Embed 'inputType' to the trip.
   */
   enbs.extractResult = (results) => EnketoSurveyAnswer.filterByNameAndVersion('TimeUseSurvey', results);

   enbs.processManualInputs = function(manualResults, resultMap) {
    if (manualResults.length > 1) {
        Logger.displayError("Found "+manualResults.length+" results expected 1", manualResults);
    } else {
        console.log("ENKETO: processManualInputs with ", manualResults, " and ", resultMap);
        const surveyResult = manualResults[0];
        resultMap[enbs.SINGLE_KEY] = surveyResult;
    }
  }

  enbs.populateInputsAndInferences = function(trip, manualResultMap) {
    console.log("ENKETO: populating trip,", trip, " with result map", manualResultMap);
    if (angular.isDefined(trip)) {
        // initialize addition arrays as empty if they don't already exist
        trip.trip_addition ||= [], trip.place_addition ||= [];
        trip.tripAddition ||= [], trip.placeAddition ||= [];
        enbs.populateManualInputs(trip, trip.nextTrip, enbs.SINGLE_KEY,
            manualResultMap[enbs.SINGLE_KEY]);
        trip.finalInference = {};
    } else {
        console.log("Trip information not yet bound, skipping fill");
    }
  }

  /**
   * Embed 'inputType' to the trip
   * This is the version that is called from the list, which focuses only on
   * manual inputs. It also sets some additional values 
   */
  enbs.populateManualInputs = function (trip, nextTrip, inputType, inputList) {
      // Check unprocessed labels first since they are more recent
      const unprocessedLabelEntry = InputMatcher.getTripAdditionsForTrip(trip,
          inputList);
      var userInputEntry = unprocessedLabelEntry;
      if (!angular.isDefined(userInputEntry)) {
          userInputEntry = trip.trip_addition[enbs.inputType2retKey(inputType)];
      }
      enbs.populateInput(trip.tripAddition, inputType, userInputEntry);
      // Logger.log("Set "+ inputType + " " + JSON.stringify(userInputEntry) + " for trip starting at " + JSON.stringify(trip.start_fmt_time));
      enbs.editingTrip = angular.undefined;
  }

  /**
   * Insert the given userInputLabel into the given inputType's slot in inputField
   */
  enbs.populateInput = function(tripField, inputType, userInputEntry) {
    if (angular.isDefined(userInputEntry)) {
          userInputEntry.forEach(ta => {
            tripField.push(ta);
          });
    }
  }

  /**
   * MODE (manual/trip_addition_input becomes trip_addition_input)
   */
  enbs.inputType2retKey = function(inputType) {
    return enbs.key.split("/")[1];
  }

  return enbs;
});