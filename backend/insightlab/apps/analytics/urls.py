from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:study_pk>/', views.study_analytics),
    path('<uuid:study_pk>/blocks/<uuid:block_pk>/', views.block_analytics),
    path('<uuid:study_pk>/report/', views.report_summary),
]
