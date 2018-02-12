$(window).on('init', function(event, state) {

    var $miningPorts;
    var miningPortTemplate;
    var lastPortsJson = '';

    state.pages.getting_started = {
        destroy: function(){
    
        },
        init: function() {
            document.getElementById('easyminer_link').setAttribute('href', easyminerDownload);
            document.getElementById('miningPoolHost').textContent = poolHost;
            $miningPorts = $('#miningPorts');
            miningPortTemplate = $miningPorts.html();
            $miningPorts.empty();
        },
        update: function(){
            var lastStats = state.lastStats;
            if (!lastStats) return;
            var portsJson = JSON.stringify(lastStats.config.ports);
            if (lastPortsJson !== portsJson) {
                lastPortsJson = portsJson;
                var $miningPortChildren = [];
                for (var i = 0; i < lastStats.config.ports.length; i++) {
                    var portData = lastStats.config.ports[i];
                    var $portChild = $(miningPortTemplate);
                    $portChild.find('.miningPort').text(portData.port);
                    $portChild.find('.miningPortDiff').text(portData.difficulty);
                    $portChild.find('.miningPortDesc').text(portData.desc);
                    $miningPortChildren.push($portChild);
                }
                $miningPorts.empty().append($miningPortChildren);
            }
    
            state.updateTextClasses('exampleHost', poolHost);
            state.updateTextClasses('examplePort', lastStats.config.ports[0].port.toString());
    
        }
    };
    
});
