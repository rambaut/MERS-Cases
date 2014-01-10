epidemic = (function () {
    "use strict";

    var epidemic = {};

    // Various formatters.
    var formatNumber = d3.format(",d"),
        formatDate = d3.time.format("%Y-%m-%d"),
        formatPrettyDate = d3.time.format("%d %b"),
        formatMonth = d3.time.format("%b %Y");

	// input data
    epidemic.prim_co_sev; // Observed number of severe primary infections in people with comorbidities
    epidemic.prim_co_ns; // Observed number of mild primary infections in people with comorbidities
    epidemic.prim_h_sev; // Observed number of severe primary infections in people without comorbidities
    epidemic.prim_h_ns; // Observed number of mild primary infections in people without comorbidities
    epidemic.sec_co_sev; // Observed number of severe secondary infections in people with comorbidities
    epidemic.sec_co_ns; // Observed number of mild secondary infections in people with comorbidities
	epidemic.sec_h_sev; // Observed number of severe secondary infections in people without comorbidities
    epidemic.sec_h_ns; // Observed number of mild secondary infections in people without comorbidities

    epidemic.parameters = [
       {
       		key:  "prim_co_sev",
            label: "Severe primary cases with comorbidities",
            description: "Observed number of severe primary infections in people with comorbidities.",
            value: 57
        },
        {
        	key: "prim_co_ns",
            label: "Mild primary cases with comorbidities",
            description: "Observed number of mild primary infections in people with comorbidities.",
            value: 1
        },
        {
        	key: "prim_h_sev",
            label: "Severe primary cases without comorbidities",
            description: "Observed number of severe primary infections in people without comorbidities.",
            value: 25
        },
        {
        	key: "prim_h_ns",
            label: "Mild primary cases without comorbidities",
            description: "Observed number of mild primary infections in people without comorbidities.",
            value: 2
        },
        {
        	key: "sec_co_sev",
            label: "Severe secondary cases with comorbidities",
            description: "Observed number of severe secondary infections in people with comorbidities.",
            value: 27
        },
        {
        	key: "sec_co_ns",
            label: "Mild secondary cases with comorbidities",
            description: "Observed number of mild secondary infections in people with comorbidities.",
            value: 1
        },
        {
        	key: "sec_h_sev",
            label: "Severe secondary cases without comorbidities",
            description: "Observed number of severe secondary infections in people without comorbidities.",
            value: 29
        },
       {
       		key: "sec_h_ns",
            label: "Mild secondary cases without comorbidities",
            description: "Observed number of mild secondary infections in people without comorbidities.",
            value: 40
        }
    ];
	
	// computed outputs 
	epidemic.P_co_primary = 0.2; // fraction of primary cases with comorbidity
	
	epidemic.P_co_secondary = 0.1; //fraction of secondary cases with comorbidity

	epidemic.P_detect_sec = 0.5; // the chance of discovery of (mild) secondary cases through contact tracing

	epidemic.P_sev_given_co; // probability of severe disease given comorbidity
	epidemic.P_sev_given_h; // probability of severe disease given previously healthy

	epidemic.T_sec_co; // total secondary cases with comorbidiites
	epidemic.T_sec_h;  // total secondary cases that were previously healthy

	epidemic.P_detect_co; //chance of discovery of (mild) primary cases in people with comorbidities
	epidemic.P_detect_h; // chance of discovery of (mild) primary cases in people who were healthy

	epidemic.T_prim_co; // total primary cases with comorbidiites
	epidemic.T_prim_h; // total primary cases that were previously healthy

    epidemic.outputs = [
        {
        	key: "P_co_primary",
            label: "fraction of primary cases with comorbidity",
        },
        {
        	key: "P_co_secondary",
            label: "fraction of secondary cases with comorbidity",
        },
        {
        	key: "P_detect_sec",
            label: "the chance of discovery of (mild) secondary cases through contact tracing",
        },
        {
        	key: "P_detect_co",
            label: "chance of discovery of (mild) primary cases in people with comorbidities",
        },
        {
        	key: "P_detect_h",
            label: "chance of discovery of (mild) primary cases in people who were healthy",
        },
        {
        	key: "P_sev_given_co",
            label: "probability of severe disease given comorbidity",
        },
        {
        	key: "P_sev_given_h",
            label: "probability of severe disease given previously healthy",
        },
        {
        	key: "T_sec_co",
            label: "total secondary cases with comorbidities",
        },
        {
        	key: "T_sec_h",
            label: "total secondary cases that were previously healthy",
        },
        {
        	key: "T_prim_co",
            label: "total primary cases with comorbidities",
        },
        {
        	key: "T_prim_h",
            label: "total primary cases that were previously healthy",
        }
   ];

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
        for (var i = 0; i < epidemic.parameters.length; i++) {
            var parameter = epidemic.parameters[i];
            destination.append( '<div id="' + parameter.key + '" class="parameter" title="' + parameter.description + '"></label>' );
            var select = $( "#" + parameter.key );
            epidemic.setupParameter(select, parameter);
        }

        destination = $( "#" + outputsDestination );
        for (var i = 0; i < epidemic.outputs.length; i++) {
            var output = epidemic.outputs[i];
            destination.append( '<div id="' + output.key + '" class="parameter" title="' + output.label + '"></label>' );
            var select = $( "#" + output.key );
            epidemic.setupOutput(select, output);
        }

		epidemic.update();
    }; // function initialize(caseData)

    epidemic.setParameter = function(name, value) {
        epidemic[name] = value;
        epidemic.update();
    };

    epidemic.setupParameter = function(select, parameter) {
        var MAX_VALUE = 100;

		var name = parameter.key;
        select.append('<label for="' + name + '_text" class="label">' + parameter.label + ':</label>');
        select.append('<input type="text" name="' + name + '_text" id="' + name + '_text" class="text"></edit>');
        select.append('<div id="' + name + '_slider" class="slider"></div>');
        select.append('<button id="' + name + '_reset" class="reset">Reset from data</button>');

        var text = $( "#" + name + "_text");
        var slider = $( "#" + name + "_slider");
        var reset = $( "#" + name + "_reset");

        var initialValue = parameter.value;

        text
        	.textinput({'filter': 'digits'}) // 'numeric' for floats
        	.val(initialValue)
        	.change(function() {
				var value = text.val();
				slider.slider("value", value);
				epidemic.setParameter(name, value);
				epidemic.update();
				epidemic.update();
			});
        	
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
 				epidemic.setParameter(name, initialValue);
				epidemic.update();
           });
    };

    epidemic.setupOutput = function(select, output) {
		var name = output.key;
        select.append('<div class="output">' + output.label + ': </div><div id="' + name + '_text" class="value"></div>');
    };

    epidemic.updateOutputs = function() {
        for (var i = 0; i < epidemic.outputs.length; i++) {
        	var key = epidemic.outputs[i].key;
            var value = epidemic[key];
            $( "#" + key + '_text' ).text(value.toPrecision(3));
        }
    };
    
	epidemic.update = function() {
		var known  = 1;
		
		var alpha = epidemic.prim_co_sev; // number of primary cases with comorbidity and severe disease
		var beta = epidemic.sec_co_sev; // number of secondary cases with comorbidity and severe disease

		var gamma = epidemic.prim_h_sev; // number of primary cases previously healthy and with severe disease
		var delta = epidemic.sec_h_sev; // number of secondary cases previously healthy and with severe disease

		var epsilon = epidemic.prim_co_ns; // number of primary cases with comorbidity and with mild disease
		var zeta = epidemic.sec_co_ns; // number of secondary cases with comorbidity and with mild disease

		var eta = epidemic.prim_h_ns; // number of primary cases previously healthy and with mild disease
		var theta = epidemic.sec_h_ns; // number of secondary cases previously healthy and with mild disease

		if (known === 1 || known ===3) {
			if (known === 3) {
				var Z = epidemic.P_co_primary; // fraction of primary cases with comorbidity

				//fraction of secondary cases with comorbidity
				epidemic.P_co_secondary = beta / (beta + ((delta * alpha * (1 - Z)) / (gamma * Z))); 				
			} else {
				var X = epidemic.P_co_secondary; // fraction of secondary cases with comorbidity

				// fraction of primary cases with comorbidity
				epidemic.P_co_primary = (alpha*delta*X)/(beta*gamma + alpha*delta*X - beta*X*gamma); 
			}

			// the chance of discovery of (mild) secondary cases through contact tracing
			epidemic.P_detect_sec = (zeta - ((zeta + theta) * epidemic.P_co_secondary)) / (((beta + delta) * epidemic.P_co_secondary) - beta);

		} else if (known === 2) {
			//fraction of secondary cases with comorbidity
			epidemic.P_co_secondary = (beta*Dsec + zeta)/((beta+delta)*epidemic.P_detect_sec + zeta + theta); 
			
			// fraction of primary cases with comorbidity
			epidemic.P_co_primary = (alpha*delta*P_co_secondary) /
									(beta*gamma + alpha*delta*epidemic.P_co_secondary - beta*epidemic.P_co_secondary*gamma); 
		}

		epidemic.P_sev_given_co = beta / (beta + (zeta / epidemic.P_detect_sec)); // probability of severe disease given comorbidity
		epidemic.P_sev_given_h = delta / (delta + (theta / epidemic.P_detect_sec)); // probability of severe disease given previously healthy

		epidemic.T_sec_co = beta + (zeta / epidemic.P_detect_sec); // total secondary cases with comorbidiites
		epidemic.T_sec_h = delta + (theta / epidemic.P_detect_sec);  // total secondary cases that were previously healthy

		epidemic.P_detect_co = (epsilon * epidemic.P_sev_given_co) / (alpha * (1 - epidemic.P_sev_given_co)); //chance of discovery of (mild) primary cases in people with comorbidities
		epidemic.P_detect_h = (eta * epidemic.P_sev_given_h) / (gamma * (1 - epidemic.P_sev_given_h)); // chance of discovery of (mild) primary cases in people who were healthy

		epidemic.T_prim_co = alpha + (epsilon / epidemic.P_detect_co); // total primary cases with comorbidiites
		epidemic.T_prim_h = gamma + (eta / epidemic.P_detect_h); // total primary cases that were previously healthy

		epidemic.updateOutputs();
	};

    return epidemic
}());
