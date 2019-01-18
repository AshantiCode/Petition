<script>rainyday.js</script>;
<script>
    function loaded_image(img)
            {
                var engine = new RainyDay({image: img});
        engine.rain([ [1, 2, 8000] ]);
        engine.rain([ [3, 3, 0.88], [5, 5, 0.9], [6, 2, 1] ], 100);
}
        </script>
