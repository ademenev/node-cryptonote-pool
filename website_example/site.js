
$( function() {

    var loaded_pages = [];
    var state = {
        currentPage : null, 
        lastStats: null,
        pages: {}
    };

    state.docCookies = {
        getItem: function (sKey) {
            return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
        },
        setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
            if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
            var sExpires = "";
            if (vEnd) {
                switch (vEnd.constructor) {
                    case Number:
                        sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                        break;
                    case String:
                        sExpires = "; expires=" + vEnd;
                        break;
                    case Date:
                        sExpires = "; expires=" + vEnd.toUTCString();
                        break;
                }
            }
            document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
            return true;
        },
        removeItem: function (sKey, sPath, sDomain) {
            if (!sKey || !this.hasItem(sKey)) { return false; }
            document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
            return true;
        },
        hasItem: function (sKey) {
            return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
        }
    };
    
    $.fn.update = function(txt){
        var el = this[0];
        if (el.textContent !== txt)
            el.textContent = txt;
        return this;
    };
    
    var updateTextClasses = state.updateTextClasses = function (className, text){
        var els = document.getElementsByClassName(className);
        for (var i = 0; i < els.length; i++){
            var el = els[i];
            if (el.textContent !== text)
                el.textContent = text;
        }
    }
    
    var updateText = state.updateText = function (elementId, text){
        var el = document.getElementById(elementId);
        if (el.textContent !== text){
            el.textContent = text;
        }
        return el;
    }
    
    var getReadableCoins = state.getReadableCoins = function (coins, digits, withoutSymbol){
        var amount = (parseInt(coins || 0) / coinUnits).toFixed(digits || coinUnits.toString().length - 1);
        return amount + (withoutSymbol ? '' : (' ' + state.lastStats.config.symbol));
    }
    
    var formatDate = state.formatDate = function (time) {
        if (!time) return '';
        return new Date(parseInt(time) * 1000).toLocaleString();
    }
    
    var formatPaymentLink = state.formatPaymentLink = function (hash){
        return '<a target="_blank" href="' + transactionExplorer + hash + '">' + hash + '</a>';
    }
    
    function getPaymentRowElement(prefix, payment, jsonString, callback){
    
        var row = document.createElement('tr');
        row.setAttribute('data-json', jsonString);
        row.setAttribute('data-time', payment.time);
        row.setAttribute('id', prefix + '-paymentRow' + payment.time);
    
        row.innerHTML = callback(payment);
    
        return row;
    }

    function parsePayment(time, serializedPayment){
        var parts = serializedPayment.split(':');
        return {
            time: parseInt(time),
            hash: parts[0],
            amount: parts[1],
            fee: parts[2],
            mixin: parts[3],
            recipients: parts[4]
        };
    }

    function getPaymentCells(payment){
        return '<td>' + formatDate(payment.time) + '</td>' +
                '<td>' + formatPaymentLink(payment.hash) + '</td>' +
                '<td>' + state.getReadableCoins(payment.amount, 4, true) + '</td>' +
                '<td>' + payment.mixin + '</td>';
    }

    var renderPayments = state.renderPayments = function (paymentsResults, rows_id, callback) {
    
        callback = callback || getPaymentCells;
        rows_id = rows_id || 'payments_rows';
        var $paymentsRows = $('#' + rows_id);
    
        for (var i = 0; i < paymentsResults.length; i += 2){
    
            var payment = parsePayment(paymentsResults[i + 1], paymentsResults[i]);
    
            var paymentJson = JSON.stringify(payment);
    
            var existingRow = document.getElementById(rows_id + '-paymentRow' + payment.time);
    
            if (existingRow && existingRow.getAttribute('data-json') !== paymentJson){
                $(existingRow).replaceWith(getPaymentRowElement(rows_id, payment, paymentJson, callback));
            }
            else if (!existingRow){
    
                var paymentElement = getPaymentRowElement(rows_id, payment, paymentJson, callback);
    
                var inserted = false;
                var rows = $paymentsRows.children().get();
                for (var f = 0; f < rows.length; f++) {
                    var pTime = parseInt(rows[f].getAttribute('data-time'));
                    if (pTime < payment.time){
                        inserted = true;
                        $(rows[f]).before(paymentElement);
                        break;
                    }
                }
                if (!inserted)
                    $paymentsRows.append(paymentElement);
            }
    
        }
    }
    
    function pulseLiveUpdate(){
        var stats_update = document.getElementById('stats_updated');
        stats_update.style.transition = 'opacity 100ms ease-out';
        stats_update.style.opacity = 1;
        setTimeout(function(){
            stats_update.style.transition = 'opacity 7000ms linear';
            stats_update.style.opacity = 0;
        }, 500);
    }
    
    window.onhashchange = function() {
        routePage();
    };
    
    var xhrPageLoading;

    function routePage(loadedCallback) {
        $('#loading').show();
    
        if (xhrPageLoading)
            xhrPageLoading.abort();
    
        $('.hot_link').parent().removeClass('active');
        var $link = $('a.hot_link[href="' + (window.location.hash || '#') + '"]');
    
        $link.parent().addClass('active');
        var page = $link.data('page');
        var pageId = page.replace('.html', '');
        var done = function() {
            $('#loading').hide();
            $('#page').show();
            $('.page-content').hide();
            $('#' + pageId).show();
            if (loadedCallback) loadedCallback();
        }
        if (!~loaded_pages.indexOf(page)) {
            xhrPageLoading = $.ajax({
                url: 'pages/' + page,
                cache: false,
                success: function (data) {
                    loaded_pages.push(page);
                    $('#page').hide();
                    var div = $('<div></div>').addClass('page-content').attr('id', pageId).html(data);
                    $('#page').append(div);
                    state.pages[pageId].init();
                    state.pages[pageId].update();
                    state.currentPage = state.pages[pageId];
                    done();
                }
            });
        } else {
            done();
        }

    }

    function updateIndex() {
        updateText('coinName', state.lastStats.config.coin);
        updateText('poolVersion', state.lastStats.config.version);
    }

    $(window).trigger('init', state);
    state.SOCKET = io('http://localhost:8117');
    state.SOCKET.on('connect', function() {
        state.SOCKET.emit('refresh_stats', {});
        $('#connection_lost').removeClass('active');
    });
    state.SOCKET.on('disconnect', function() {
        $('#connection_lost').addClass('active');
    });
    state.SOCKET.on('reconnect', function() {
        state.SOCKET.emit('refresh_stats', {});
        $('#connection_lost').removeClass('active');
    });
    routePage(function() {
        state.SOCKET.on('stats', function(data) {
            state.lastStats = data;
            pulseLiveUpdate();
            updateIndex();
            if (state.currentPage) state.currentPage.update();
        });
    });
});
