/***************************************
  BOARD UPDATER
  Base object that is extended by
  board-type-specific updaters
***************************************/

RB.BoardUpdater = RB.Object.create({

  initialize: function(){
    var self = this;

    RB.$('#refresh').bind('click', function(e,u){ self.handleRefreshClick(e,u); });
    RB.$('#disable_autorefresh').bind('click', function(e,u){ self.handleDisableAutorefreshClick(e,u); });

    this.loadPreferences();
    this.pollWait = RB.constants.autorefresh_wait;
    this.poll();
  },

  adjustPollWait: function(itemsReceived){
    itemsReceived = (itemsReceived==null) ? 0 : itemsReceived;

    if(itemsReceived==0 && this.pollWait < 300000 && !RB.$('body').hasClass('no_autorefresh')){
      this.pollWait += 250;
    } else {
      this.pollWait = RB.constants.autorefresh_wait;
    }
  },

  getData: function(){
    var self = this;

    RB.ajax({
      type      : "GET",
      url       : RB.urlFor('show_updated_items', { id: RB.constants.project_id} ) + '?' + self.params,
      data      : {
                    since : RB.$('#last_updated').text()
                  },
      beforeSend: function(){ RB.$('body').addClass('loading');  },
      success   : function(d,t,x){ self.processData(d,t,x);  },
      error     : function(){ self.processError(); }
    });
  },

  handleDisableAutorefreshClick: function(event, ui){
    RB.$('body').toggleClass('no_autorefresh');
    RB.UserPreferences.set('autorefresh', !RB.$('body').hasClass('no_autorefresh'));
    if(!RB.$('body').hasClass('no_autorefresh')){
      this.pollWait = RB.constants.autorefresh_wait;
      this.poll();
    }
    this.updateAutorefreshText();
  },

  handleRefreshClick: function(event, ui){
    this.getData();
  },

  loadPreferences: function(){
    var ar = RB.UserPreferences.get('autorefresh')=="true";

    if(ar){
      RB.$('body').removeClass('no_autorefresh');
    } else {
      RB.$('body').addClass('no_autorefresh');
    }
    this.updateAutorefreshText();
  },

  poll: function() {
    if(!RB.$('body').hasClass('no_autorefresh')){
      var self = this;
      setTimeout(function(){ self.getData(); }, self.pollWait);
    } else {
      return false;
    }
  },

  processAllItems: function(){
    throw "RB.BoardUpdater.processAllItems() was not overriden by child object";
  },

  processData: function(data, textStatus, xhr){
    var self = this, latest_update;

    RB.$('body').removeClass('loading');

    latest_update = RB.$(data).find('#last_updated').text();
    if(latest_update.length > 0) {
        RB.$('#last_updated').text(latest_update);
    }
    sprintestimatedhours = RB.$(data).find('#sprintestimatedhours').text();
    if(sprintestimatedhours.length > 0) {
        RB.$('#sprintestimatedhours').text(sprintestimatedhours);
    }

    var ph2_all_count = RB.$('#stories-for-product-backlog li').find(".phase_field:contains('PH2')").length;

    var bugsCnt = RB.$('#stories-for-product-backlog li').find(".phase_field:contains('PH2')").closest('.model').find(".tracker_name_field:contains('【バグ')").length;
    var siyoufubiCnt = RB.$('#stories-for-product-backlog li').find(".phase_field:contains('PH2')").closest('.model').find(".tracker_name_field:contains('【仕様不備')").length;
    var siyouhenkouCnt = RB.$('#stories-for-product-backlog li').find(".phase_field:contains('PH2')").closest('.model').find(".tracker_name_field:contains('【仕様変更')").length;
    var functional_ticket_count = RB.$('#stories-for-product-backlog li').find(".tracker_name_field:contains('機能')").length;
    var assignee_name_hd_clzzs = RB.$('.assignee_name_hd_clzz');
    RB.$.each(assignee_name_hd_clzzs, function(i, value) {
      if(RB.$(value).val() !== '') {
        RB.$(value).prev('.prevent_edit').addClass('prevent_edit_exists_pic');
      }
    });
    var triage_level_clzz = RB.$('.triage_level_clzz');
    RB.$.each(triage_level_clzz, function(i, value) {
      if(RB.$(value).val() === '2') {
        RB.$(value).siblings('.prevent_edit').addClass('prevent_edit_middle_1');
      }
      else if(RB.$(value).val() === '4' || RB.$(value).val() === '5') {
        RB.$(value).siblings('.prevent_edit').addClass('prevent_edit_high');
      }
      else if(RB.$(value).val() === '6') {
        RB.$(value).siblings('.prevent_edit').addClass('prevent_edit_emergency');
      }
    });
    var ph2_count = ph2_all_count - functional_ticket_count;
    RB.$('#product_backlog_container').find('.name').find('#total_bugfix_counts').html('<span style="font-size: 13px;">' + '（PH2チケット数：' + 'バグ:' + bugsCnt + ' 、 ' + '仕不備:' + siyoufubiCnt + ' 、 ' + '仕変:' + siyouhenkouCnt +  '）</span>');


    self.processAllItems(data);
    self.adjustPollWait(RB.$(data).children(":not(.meta)").length);
    self.poll();
  },

  processError: function(){
    this.adjustPollWait(0);
    this.poll();
  },

  updateAutorefreshText: function(){
    if(RB.$('body').hasClass('no_autorefresh')){
      RB.$('#disable_autorefresh').text('Enable Auto-refresh');
    } else {
      RB.$('#disable_autorefresh').text('Disable Auto-refresh');
    }
  }
});
