(function(blocks, blockEditor, element, components, i18n) {

    var el            = element.createElement,
        SelectControl = components.SelectControl,
        Button        = components.Button,
        __            = i18n.__;

    // The widgets as the page loaded them, re-read when a select is focused or the tab comes back: a widget made in another tab is offered.
    var feeds = grwBlockData.feeds, listeners = [], loading = null;
    function reload() {
        if (loading || !listeners.length) return;
        var fd = new FormData();
        fd.append('action', 'grw_feeds');
        fd.append('grw_nonce', grwBlockData.nonce);
        loading = fetch(grwBlockData.ajax, {method: 'POST', credentials: 'same-origin', body: fd})
            .then(function(r) { return r.json(); })
            .then(function(res) {
                if (res && res.status === 'success') {
                    feeds = res.result;
                    listeners.forEach(function(f) { f(feeds); });
                }
            })
            .catch(function() {})
            .then(function() { loading = null; });
    }
    document.addEventListener('visibilitychange', function() { if (document.visibilityState === 'visible') reload(); });

    blocks.registerBlockType('widget-google-reviews/reviews', {
        apiVersion: 3,
        title: __('Google Reviews Block', 'widget-google-reviews'),
        icon: 'star-filled',
        category: 'widgets',
        keywords: ['google', 'reviews', 'google reviews', 'block'],
        attributes: {id: {type: 'string'}},

        edit: function(props) {

            var attributes = props.attributes;
            var blockProps = blockEditor.useBlockProps();
            var state = element.useState(feeds), list = state[0], setList = state[1];
            element.useEffect(function() {
                listeners.push(setList);
                return function() { var i = listeners.indexOf(setList); if (i >= 0) listeners.splice(i, 1); };
            }, []);

            var options = [{label: __('Select reviews widget', 'widget-google-reviews'), value: ''}];
            for (var i = 0; i < list.length; i++) {
                options.push({label: list[i].name, value: String(list[i].id)});
            }
            var chosen = list.some(function(feed) { return String(feed.id) === attributes.id; });

            return el(
                'div',
                blockProps,
                el(
                    SelectControl,
                    {
                        label: __('Reviews widget', 'widget-google-reviews'),
                        name: 'id',
                        value: attributes.id || '',
                        options: options,
                        onChange: function(newval) {
                            props.setAttributes({id: newval});
                        },
                        onFocus: reload
                    }
                ),
                grwBlockData.manage && el(
                    Button,
                    {
                        text: __('Edit reviews widget', 'widget-google-reviews'),
                        href: grwBlockData.createUrl + '&grw_feed_id=' + attributes.id,
                        disabled: !chosen,
                        target: '_blank'
                    }
                ),
                grwBlockData.manage && el(
                    Button,
                    {
                        text: __('Create new reviews widget', 'widget-google-reviews'),
                        href: grwBlockData.createUrl,
                        target: '_blank'
                    }
                )
            );
        },

        save: function() {
            return null;
        }
    });
}(
    window.wp.blocks,
    window.wp.blockEditor,
    window.wp.element,
    window.wp.components,
    window.wp.i18n
));
