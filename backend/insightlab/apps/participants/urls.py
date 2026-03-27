from django.urls import path
from . import views

urlpatterns = [
    # Public (participant)
    path('start/<uuid:token>/', views.session_start),
    path('<uuid:session_token>/consent/', views.session_consent),
    path('<uuid:session_token>/response/', views.session_response),
    path('<uuid:session_token>/complete/', views.session_complete),
    path('<uuid:session_token>/heatmap/', views.heatmap_batch),
    path('<uuid:session_token>/recording/', views.recording_upload),
    # Researcher (authenticated)
    path('study/<uuid:study_pk>/', views.study_sessions),
    path('study/<uuid:study_pk>/session/<uuid:session_pk>/', views.session_detail),
    path('study/<uuid:study_pk>/block/<uuid:block_pk>/heatmap/', views.session_heatmap),
]
