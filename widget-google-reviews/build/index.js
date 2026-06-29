(function(blocks, blockEditor, element, components, i18n) {

    var el            = element.createElement,
        SelectControl = components.SelectControl,
        Button        = components.Button,
        __            = i18n.__;

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

            let feeds = grwBlockData.feeds,
                options = [{label: __('Select reviews widget', 'widget-google-reviews'), value: ''}];

            for (let i = 0; i < feeds.length; i++) {
                options.push({label: feeds[i].name, value: String(feeds[i].id)});
            }

            return el(
                'div',
                blockProps,
                el(
                    SelectControl,
                    {
                        id: 'id',
                        name: 'id',
                        value: attributes.id || '',
                        options: options,
                        onChange: function(newval) {
                            props.setAttributes({id: newval});
                        }
                    }
                ),
                el(
                    Button,
                    {
                        text: __('Edit reviews widget', 'widget-google-reviews'),
                        href: grwBlockData.builderUrl + '&grw_feed_id=' + attributes.id,
                        target: '_blank'
                    }
                ),
                el(
                    Button,
                    {
                        text: __('Create new reviews widget', 'widget-google-reviews'),
                        href: grwBlockData.builderUrl,
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