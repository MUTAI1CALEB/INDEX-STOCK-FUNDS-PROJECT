"""
Session ID Middleware for Global InvestIQ.

Extracts X-Session-ID from request headers and attaches it to the request
object so views don't need session-tracking boilerplate.
"""
import uuid


class SessionIDMiddleware:
    """
    Middleware that extracts the X-Session-ID header from incoming requests
    and attaches it as `request.session_id`. If no header is present,
    generates a new UUID for the request lifecycle.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        session_id = request.META.get('HTTP_X_SESSION_ID', '')
        if not session_id:
            session_id = str(uuid.uuid4())
        request.session_id = session_id
        response = self.get_response(request)
        # Echo back the session ID so the frontend can persist it
        response['X-Session-ID'] = session_id
        return response
