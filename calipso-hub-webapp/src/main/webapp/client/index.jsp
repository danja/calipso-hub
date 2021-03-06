<!DOCTYPE html>
<%@page contentType="text/html;charset=UTF-8"%>
<html lang="en">
<head>
<%@ include file="../includes/head.jsp" %>
</head>
<body class="full-height-column">

    <div class=" full-height-row" id="calipsoHeaderRegion">
    </div>

    <main class="full-height-row-expanded">
        <div class="container configurable-fluid" id="calipsoMainContentRegion"></div>
    </main>

    <div class="full-height-row">
        <div id="calipsoModalRegion" class="modal fade" tabindex='-1'></div>
        <div id="hiddenWrapper" style="display: none"></div>
        <div class="social-form-container">
        </div>
    </div>

    <footer class="full-height-row">
        <div  id="calipsoFooterRegion"></div>
        <div class="container configurable-fluid">
            <div class="row">
                <div class="col-xs-12 copyright">
                    <p class="credit text-muted text-center">
                        Last updated: ${dev.build.timestamp}
                    </p>
                </div>
            </div>
        </div>
    </footer>

    <!-- Placed at the end of the document so the pages load faster -->
    <script data-main="${basePath}/js/main" id="calipso-script-main" src="${basePath}/js/lib/require.js">
    </script>
</body>
</html>
