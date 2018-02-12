$(window).on('init', function(event, state) {

    var updateText = state.updateText;
    
    var address = state.docCookies.getItem('mining_address');

    function calcEstimateProfit(){
        try {
            var rateUnit = Math.pow(1000,parseInt($('#calcHashUnit').data('mul')));
            var inp2 = parseFloat($('#calcHashRate').val()) * rateUnit;
            var resl = ( state.lastStats.network.reward / coinUnits) / ((state.lastStats.network.difficulty / inp2) / 86400  );
            if (!isNaN(resl)) {
                updateText('calcHashAmount', (Math.round(resl * 100) / 100).toString());
                return;
            }
        }
        catch(e){ }
        updateText('calcHashAmount', '');
    }
    
    /* Stats by mining address lookup */
    function changeAddress (){
    
        var addr = $('#yourStatsInput').val().trim();
        if (!addr){
            $('#yourStatsInput').focus();
            return;
        }
    
        $('#addressError').hide();
        $('.yourStats').hide();
        $('#payments_rows-my').empty();
    
        $('#lookUp > span:first-child').hide();
        $('#lookUp > span:last-child').show();
    
        address = addr;
        SOCKET.emit('address', address);
    
    }

    function updateMinerStats(data) {
        $('#lookUp > span:last-child').hide();
        $('#lookUp > span:first-child').show();
    
        if (!data.stats) {
            $('.yourStats').hide();
            $('#addressError').text(data.error).show();
            return;
        }
        $('#addressError').hide();
        updateText('yourAddressDisplay', address);
    
        if (data.stats.lastShare)
            $('#yourLastShare').timeago('update', new Date(parseInt(data.stats.lastShare) * 1000).toISOString());
        else
            updateText('yourLastShare', 'Never');
    
        updateText('yourHashrateHolder', (data.stats.hashrate || '0 H') + '/sec');
        updateText('yourHashes', (data.stats.hashes || 0).toString());
        updateText('yourPaid', state.getReadableCoins(data.stats.paid));
        updateText('yourPendingBalance', state.getReadableCoins(data.stats.balance));
    
        state.renderPayments(data.payments, 'payments_rows-my');
    
        $('.yourStats').show();
    
        state.docCookies.setItem('mining_address', address, Infinity);
    }
    
    function requestMinerStarts() {
        if (address) {
            state.SOCKET.emit('address', address);
        }
    }
    
    state.pages.home = {
        init: function() {
            requestMinerStarts();
            state.SOCKET.on('miner_stats', updateMinerStats);
            state.SOCKET.on('reconnect', requestMinerStarts);
            $('#networkLastBlockFound,#poolLastBlockFound,#yourLastShare,#marketLastUpdated').timeago();
            $('#lookUp').click(changeAddress);
            if (address){
                $('#yourStatsInput').val(address);
                //changeAddress();
            }
            
            $('#yourStatsInput').keyup(function(e){
                if(e.keyCode === 13)
                    $('#lookUp').click();
            });
            
            $('#loadMorePayments-my').click(function(){
                var request = {
                    time: $('#payments_rows-my').children().last().data('time'),
                    address: address
                };
                state.SOCKET.emit('payments', request, function(result) {
                     state.renderPayments(result, 'payments_rows-my');
                });
            });
        

            var intervalMarketPolling = setInterval(updateMarkets, 300000); //poll market data every 5 minutes
            var xhrMarketGets = {};
            updateMarkets();
            function updateMarkets(){
                var completedFetches = 0;
                var marketsData = [];
                for (var i = 0; i < cryptonatorWidget.length; i++){
                    (function(i){
                        xhrMarketGets[cryptonatorWidget[i]] = $.get('https://api.cryptonator.com/api/ticker/' + cryptonatorWidget[i], function(data){
                            marketsData[i] = data;
                            completedFetches++;
                            if (completedFetches !== cryptonatorWidget.length) return;
            
                            var $marketHeader = $('#marketHeader');
                            $('.marketTicker').remove();
                            for (var f = marketsData.length - 1; f >= 0 ; f--){
                                var price = parseFloat(marketsData[f].ticker.price);
            
                                if (price > 1) price = Math.round(price * 100) / 100;
                                else price = marketsData[f].ticker.price;
            
                                $marketHeader.after('<div class="marketTicker">' + marketsData[f].ticker.base + ': <span>' + price + ' ' + marketsData[f].ticker.target + '</span></div>');
                            }
                            $('#marketLastUpdated').timeago('update', new Date(marketsData[0].timestamp * 1000).toISOString());
                        }, 'json');
                    })(i);
                }
            }
            
            /* Hash Profitability Calculator */
            
            $('#calcHashRate').keyup(calcEstimateProfit).change(calcEstimateProfit);
            
            $('#calcHashUnits > li > a').click(function(e){
                e.preventDefault();
                $('#calcHashUnit').text($(this).text()).data('mul', $(this).data('mul'));
                calcEstimateProfit();
            });
            
        },
        update: function(){
            if (!state.lastStats) return;
            var lastStats = state.lastStats;
            $('#networkLastBlockFound').timeago('update', new Date(lastStats.network.timestamp * 1000).toISOString());
            updateText('networkHashrate', getReadableHashRateString(lastStats.network.difficulty / 120) + '/sec');
            updateText('networkDifficulty', lastStats.network.difficulty.toString());
            updateText('blockchainHeight', lastStats.network.height.toString());
            updateText('networkLastReward', state.getReadableCoins(lastStats.network.reward, 4));
            updateText('lastHash', lastStats.network.hash.substr(0, 13) + '...').setAttribute('href',
                blockchainExplorer + lastStats.network.hash
            );
    
            updateText('poolHashrate', getReadableHashRateString(lastStats.pool.hashrate) + '/sec');
    
            if (lastStats.pool.lastBlockFound){
                var d = new Date(parseInt(lastStats.pool.lastBlockFound)).toISOString();
                $('#poolLastBlockFound').timeago('update', d);
            }
            else
                $('#poolLastBlockFound').removeAttr('title').data('ts', '').update('Never');
    
            //updateText('poolRoundHashes', lastStats.pool.roundHashes.toString());
            updateText('poolMiners', lastStats.pool.miners.toString());
    
    
            var totalFee = lastStats.config.fee;
            if (lastStats.config.doDonations){
                totalFee += lastStats.config.donation;
                totalFee += lastStats.config.coreDonation;
                var feeText = [];
                if (lastStats.config.donation > 0) feeText.push(lastStats.config.donation + '% to pool dev');
                if (lastStats.config.coreDonation > 0) feeText.push(lastStats.config.coreDonation + '% to core devs');
                updateText('poolDonations', feeText.join(', '));
            }
            else{
                updateText('poolDonations', '');
            }
    
            updateText('poolFee', totalFee + '%');
    
    
            updateText('blockSolvedTime', getReadableTime(lastStats.network.difficulty / lastStats.pool.hashrate));
            updateText('calcHashSymbol', lastStats.config.symbol);
    
            calcEstimateProfit();
        }
    };
    
    function getReadableTime(seconds){
    
        var units = [ [60, 'second'], [60, 'minute'], [24, 'hour'],
            [7, 'day'], [4, 'week'], [12, 'month'], [1, 'year'] ];
    
        function formatAmounts(amount, unit){
            var rounded = Math.round(amount);
            return '' + rounded + ' ' + unit + (rounded > 1 ? 's' : '');
        }
    
        var amount = seconds;
        for (var i = 0; i < units.length; i++){
            if (amount < units[i][0])
                return formatAmounts(amount, units[i][1]);
            amount = amount / units[i][0];
        }
        return formatAmounts(amount,  units[units.length - 1][1]);
    }
    
    function getReadableHashRateString(hashrate){
        var i = 0;
        var byteUnits = [' H', ' KH', ' MH', ' GH', ' TH', ' PH' ];
        while (hashrate > 1000){
            hashrate = hashrate / 1000;
            i++;
        }
        return hashrate.toFixed(2) + byteUnits[i];
    }
    
    
    
    
    /* Market data polling */
    
});
