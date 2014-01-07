epidemic = (function () {
    "use strict";

    var epidemic = {};

    // Various formatters.
    var formatNumber = d3.format(",d"),
        formatDate = d3.time.format("%Y-%m-%d"),
        formatPrettyDate = d3.time.format("%d %b"),
        formatMonth = d3.time.format("%b %Y");

    epidemic.parameters = {
        "prim_co_sev": {
            label: "Severe primary cases<br />with comorbidities",
            description: "Observed number of severe primary infections in people with comorbidities.",
            value: 57
        },
        "prim_co_ns": {
            label: "Mild primary cases<br />with comorbidities",
            description: "Observed number of mild primary infections in people with comorbidities.",
            value: 1
        },
        "prim_h_sev": {
            label: "Severe primary cases<br />without comorbidities",
            description: "Observed number of severe primary infections in people without comorbidities.",
            value: 25
        },
        "prim_h_ns": {
            label: "Mild primary cases<br />without comorbidities",
            description: "Observed number of mild primary infections in people without comorbidities.",
            value: 2
        },
        "sec_co_sev": {
            label: "Severe secondary cases<br />with comorbidities",
            description: "Observed number of severe secondary infections in people with comorbidities.",
            value: 27
        },
        "sec_co_ns": {
            label: "Mild secondary cases<br />with comorbidities",
            description: "Observed number of mild secondary infections in people with comorbidities.",
            value: 1
        },
        "sec_h_sev": {
            label: "Severe secondary cases<br />without comorbidities",
            description: "Observed number of severe secondary infections in people without comorbidities.",
            value: 29
        },
        "sec_h_ns": {
            label: "Mild secondary cases<br />without comorbidities",
            description: "Observed number of mild secondary infections in people without comorbidities.",
            value: 40
        }
    };

    epidemic.outputs = {
        "prim_obs": {
            label: "Observed primary cases",
            value: null
        },
        "prim_unobs": {
            label: "Undetected primary cases",
            value: null
        }
   };


    /*
    Create the crossfilter from the case data
    */
    epidemic.initialize = function(caseData, parametersDestination, outputsDestination) {

        epidemic.cases = [];
        epidemic.clusters = {};

        caseData.forEach(function(d, i) {
            d.index = i;

            if (d.onset !== null) {
                d.onset = formatDate.parse(d.onset);
            }

            if (d.hospitalized !== null) {
                d.hospitalized = formatDate.parse(d.hospitalized);
            }

            if (d.reported !== null) {
                d.reported = formatDate.parse(d.reported);
            }

            if (d.death !== null) {
                d.death = formatDate.parse(d.death);
                if (d.death !== null || d.outcome === 'fatal') {
                    d.outcome = 2;
                } else {
                    d.outcome = 1;
                }
            } else if (d.outcome === 'fatal') {
                d.outcome = 2;
            } else {
                d.outcome = 1;
            }

            d.date = d.onset;
            d.dateType = "onset";

            if (d.date === null) {
                d.date = d.hospitalized;
                d.dateType = "hospitalized";
            }
            if (d.date === null) {
                d.date = d.death;
                d.dateType = "death";

                if (d.date === null || d.reported < d.date) {
                    d.date = d.reported;
                    d.dateType = "reported";
                }
            }

            // convert age to number (with be NaN if parsing fails).
            d.age = +d.age;
            if (d.age === null || isNaN(d.age)) {
                d.age = -100;
            }

            if (d.gender === 'F') {
                d.genderCode = 1;
            } else if (d.gender === 'M') {
                d.genderCode = 2;
            } else {
                d.genderCode = 3;
            }

            if (d.date !== null) {
                epidemic.cases.push(d);
            }

            if ((d.cluster !== null && d.cluster.length > 0) || d.secondary === "TRUE") {
                if (d.cluster === undefined || d.cluster === null || d.cluster.length === 0) {
                    // if there is no cluster defined but is a secondary
                    // create a new cluster label based on the number
                    d.cluster = "#" + d.number;
                }

                if (d.cluster in epidemic.clusters) {
                    epidemic.clusters[d.cluster].count ++;
                } else {
                    epidemic.clusters[d.cluster] = {
                        name: d.cluster,
                        count: 1
                    };
                }
                d.cluster = epidemic.clusters[d.cluster];
            } else {
                d.cluster = null;
            }

            d.comorbidity = (d.comorbidity === "TRUE" ? "existing" : (d.comorbidity === "FALSE" ? "none" : "unknown"));

            if (!(d.clinical === undefined)) {
                var clin = (d.clinical.split(" ")[0]);
                d.clinical = (clin === "clinical" || clin === "fatal" ? "severe/clinical" : (clin === "subclinical" ? "mild/subclinical" : "unknown"));
            }

            d.contact = (d.secondary === "TRUE" ? d.contact : "primary");
            d.contact = (d.contact === "contact" ? "unspecified contact" : d.contact);

            d.status = (d.suspected === "TRUE" ? "suspected" : "confirmed");

            // console.log(d.code + ": " + d.age + ", " + d.gender + ", " + d.country + " [" + d.dateType + "], " + d.secondary + ", " + d.cluster);
         });

        var ageGroupSize = 5;

          // Create the crossfilter for the relevant dimensions and groups.
        epidemic.crossfilter = crossfilter(epidemic.cases);
        epidemic.filteredCases = epidemic.crossfilter.groupAll();
        epidemic.allCases = epidemic.crossfilter.dimension(function(d) { return d; });

/*		  onsetDate = crossFilter.dimension(function(d) { return d.date; }),
          onsetDates = onsetDate.group(d3.time.week),
          country = crossFilter.dimension(function(d) { return d.country; }),
          countries = country.group(function(d) { return d; }),
          location = crossFilter.dimension(function(d) { return (d.country == "KSA" ? d.city.name : "other countries" ); }),
          locations = location.group(function(d) { return d; }),
          gender = crossFilter.dimension(function(d) { return d.genderCode; }),
          genders = gender.group(function(d) { return d; }),
          death = crossFilter.dimension(function(d) { return d.outcome }),
          deathStates = death.group(function(d) { return d; }),
          severity = crossFilter.dimension(function(d) { return d.clinical }),
          severityGroups = severity.group(function(d) { return d; }),
          comorbidity = crossFilter.dimension(function(d) { return d.comorbidity }),
          comorbidityGroups = comorbidity.group(function(d) { return d; }),
          age = crossFilter.dimension(function(d) { return d.age; }),
          ageGroups = age.group(function(d) { return Math.floor(d / ageGroupSize) * ageGroupSize; }),
          ageGroups2 = age.group(function(d) { return d; }),
          contact = crossFilter.dimension(function(d) { return d.contact; }),
          contactTypes = contact.group(function(d) { return d; }),
          cluster = crossFilter.dimension(function(d) { return (d.cluster != null ? d.cluster.count : 1); });
          clusterSizes = cluster.group().reduceSum(function(d) { return (d.cluster != null ? 1 / d.cluster.count : 1); }),
          caseStatus = crossFilter.dimension(function(d) { return d.status; }),
          caseStatusType = caseStatus.group(function(d) { return d; }),
          dateType = crossFilter.dimension(function(d) { return (d.dateType === "onset" || d.dateType === "hospitalized" ? "with date of case" : "only date of report"); }),
          dateTypes = dateType.group(function(d) { return d; });
*/

        var destination = $( "#" + parametersDestination );
        var name;
        for (name in epidemic.parameters) {
            var parameter = epidemic.parameters[name];
            destination.append( '<div id="' + name + '" class="parameter" title="' + parameter.description + '"></label>' );
            var select = $( "#" + name );
            epidemic.setupParameter(select, name);
        }

        nv.addGraph(function() {
            var chart = nv.models.discreteBarChart()
              .x(function(d) { return d.label })
              .y(function(d) { return d.value })
              .staggerLabels(true)
              .tooltips(false)
              .showValues(true);

            destination = $( "#" + outputsDestination );
            destination.append( '<svg style="width:200px; height:200px;"></svg>' );

            d3.select('#' + outputsDestination + ' svg')
              .datum(binaryData(epidemic.outputs['']))
            .transition().duration(500)
              .call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });

    }; // function initialize(caseData)

    function binaryData(name, label1, value1, label2, value2) {
        return [
            {
                key: name,
                values: [
                    {
                        "label" : label1,
                        "value" : value1
                    },
                    {
                        "label" : label2,
                        "value" : value2
                    }
                ]
            }
        ];
    }

    epidemic.getParameter = function(name) {
        return epidemic.parameters[name].value;
    };

    epidemic.setParameter = function(name, value) {
        epidemic.parameters[name] = value;
        epidemic.update();
    };

    epidemic.setupParameter = function(select, name) {
        var MAX_VALUE = 100;

        var parameter = epidemic.parameters[name];
        select.append('<label for="' + name + '_text" class="label">' + parameter.label + ':</label>');
        select.append('<input type="text" name="' + name + '_text" id="' + name + '_text" class="text"></edit>');
        select.append('<div id="' + name + '_slider" class="slider"></div>');
        select.append('<button id="' + name + '_reset" class="reset">Reset from data</button>');

        var text = $( "#" + name + "_text");
        var slider = $( "#" + name + "_slider");
        var reset = $( "#" + name + "_reset");

        var initialValue = parameter.value;

        text
        	.val(initialValue);
        	
        epidemic[name] = initialValue;

        slider
        	.slider({
				min: 0.0,
				max: MAX_VALUE,
	//			value: initialValue * MAX_VALUE,
				value: initialValue,
				slide: function( event, ui ) {
	//				var value = ui.value / MAX_VALUE;
					var value = ui.value;
					text.val(value);
					epidemic.setParameter(name, value);
					epidemic.update();
				}
			});

        reset
            .click(function( event ) {
                text.val(initialValue);
//				slider.slider("value", initialValue * MAX_VALUE);
                slider.slider("value", initialValue);
            });
    };

    epidemic.update = function() {

    };

    return epidemic
}());
