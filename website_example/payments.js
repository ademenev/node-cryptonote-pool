$(window).on('init', function(event, state) {
    state.pages.payments = {
        destroy: function(){
        },

        init: function() {
            $('#loadMorePayments').click(function(){
                var request = {
                    time: $('#payments_rows').children().last().data('time')
                };
                state.SOCKET.emit('payments', request, function(data) {
                    state.renderPayments(data, null, getPaymentCells);
                });
            });
        },
        update: function() {
            var lastStats = state.lastStats;
            if (!lastStats) return;
            state.updateText('paymentsTotal', lastStats.pool.totalPayments.toString());
            state.updateText('paymentsTotalPaid', lastStats.pool.totalMinersPaid.toString());
            state.updateText('paymentsMinimum', state.getReadableCoins(lastStats.config.minPaymentThreshold, 3));
            state.updateText('paymentsDenomination', state.getReadableCoins(lastStats.config.denominationUnit, 3));
            state.renderPayments(lastStats.pool.payments, null, getPaymentCells);
        }
    };
    
    function getPaymentCells(payment){
        return '<td>' + state.formatDate(payment.time) + '</td>' +
                '<td>' + state.formatPaymentLink(payment.hash) + '</td>' +
                '<td>' + state.getReadableCoins(payment.amount, 4, true) + '</td>' +
                '<td>' + state.getReadableCoins(payment.fee, 4, true) + '</td>' +
                '<td>' + payment.mixin + '</td>' +
                '<td>' + payment.recipients + '</td>';
    }
    
   
});
