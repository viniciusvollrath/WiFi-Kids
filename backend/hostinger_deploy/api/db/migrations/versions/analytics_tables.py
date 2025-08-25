"""Add analytics tables

Revision ID: analytics_tables_001
Revises: fd3454a8c133
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'analytics_tables_001'
down_revision = 'fd3454a8c133'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create student_performance table
    op.create_table('student_performance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('mac_address', sa.String(length=17), nullable=False),
        sa.Column('router_id', sa.String(length=50), nullable=False),
        sa.Column('total_challenges', sa.Integer(), nullable=True),
        sa.Column('successful_challenges', sa.Integer(), nullable=True),
        sa.Column('failed_challenges', sa.Integer(), nullable=True),
        sa.Column('average_score', sa.Float(), nullable=True),
        sa.Column('total_time_spent', sa.Integer(), nullable=True),
        sa.Column('subject_performance', sqlite.JSON, nullable=True),
        sa.Column('current_difficulty', sa.String(length=20), nullable=True),
        sa.Column('difficulty_history', sqlite.JSON, nullable=True),
        sa.Column('learning_streak', sa.Integer(), nullable=True),
        sa.Column('best_streak', sa.Integer(), nullable=True),
        sa.Column('last_activity', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_student_performance_mac_address'), 'student_performance', ['mac_address'], unique=False)
    op.create_index(op.f('ix_student_performance_router_id'), 'student_performance', ['router_id'], unique=False)

    # Create challenge_analytics table
    op.create_table('challenge_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('challenge_id', sa.String(length=36), nullable=False),
        sa.Column('mac_address', sa.String(length=17), nullable=False),
        sa.Column('router_id', sa.String(length=50), nullable=False),
        sa.Column('persona_used', sa.String(length=20), nullable=False),
        sa.Column('subject', sa.String(length=20), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),
        sa.Column('agent_type', sa.String(length=20), nullable=False),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('correct_answers', sa.Integer(), nullable=True),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('passed', sa.Boolean(), nullable=False),
        sa.Column('time_to_complete', sa.Integer(), nullable=True),
        sa.Column('time_per_question', sa.Float(), nullable=True),
        sa.Column('answer_details', sqlite.JSON, nullable=True),
        sa.Column('feedback_received', sa.Text(), nullable=True),
        sa.Column('hints_used', sa.Integer(), nullable=True),
        sa.Column('attempts_made', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['challenge_id'], ['challenges.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_challenge_analytics_challenge_id'), 'challenge_analytics', ['challenge_id'], unique=False)
    op.create_index(op.f('ix_challenge_analytics_mac_address'), 'challenge_analytics', ['mac_address'], unique=False)
    op.create_index(op.f('ix_challenge_analytics_router_id'), 'challenge_analytics', ['router_id'], unique=False)

    # Create learning_paths table
    op.create_table('learning_paths',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('mac_address', sa.String(length=17), nullable=False),
        sa.Column('router_id', sa.String(length=50), nullable=False),
        sa.Column('current_subject', sa.String(length=20), nullable=False),
        sa.Column('current_difficulty', sa.String(length=20), nullable=False),
        sa.Column('learning_phase', sa.String(length=20), nullable=True),
        sa.Column('subject_mastery', sqlite.JSON, nullable=True),
        sa.Column('recommended_subject', sa.String(length=20), nullable=True),
        sa.Column('recommended_difficulty', sa.String(length=20), nullable=True),
        sa.Column('recommended_persona', sa.String(length=20), nullable=True),
        sa.Column('learning_goals', sqlite.JSON, nullable=True),
        sa.Column('achievements', sqlite.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_learning_paths_mac_address'), 'learning_paths', ['mac_address'], unique=False)
    op.create_index(op.f('ix_learning_paths_router_id'), 'learning_paths', ['router_id'], unique=False)

    # Create agent_performance table
    op.create_table('agent_performance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_type', sa.String(length=20), nullable=False),
        sa.Column('persona', sa.String(length=20), nullable=False),
        sa.Column('model_used', sa.String(length=50), nullable=True),
        sa.Column('total_challenges_generated', sa.Integer(), nullable=True),
        sa.Column('successful_validations', sa.Integer(), nullable=True),
        sa.Column('failed_validations', sa.Integer(), nullable=True),
        sa.Column('average_response_time', sa.Float(), nullable=True),
        sa.Column('average_student_score', sa.Float(), nullable=True),
        sa.Column('student_satisfaction', sa.Float(), nullable=True),
        sa.Column('challenge_difficulty_accuracy', sa.Float(), nullable=True),
        sa.Column('error_count', sa.Integer(), nullable=True),
        sa.Column('error_types', sqlite.JSON, nullable=True),
        sa.Column('usage_by_subject', sqlite.JSON, nullable=True),
        sa.Column('usage_by_difficulty', sqlite.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_agent_performance_agent_type'), 'agent_performance', ['agent_type'], unique=False)
    op.create_index(op.f('ix_agent_performance_persona'), 'agent_performance', ['persona'], unique=False)

    # Create system_metrics table
    op.create_table('system_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('hour', sa.Integer(), nullable=False),
        sa.Column('total_requests', sa.Integer(), nullable=True),
        sa.Column('successful_requests', sa.Integer(), nullable=True),
        sa.Column('failed_requests', sa.Integer(), nullable=True),
        sa.Column('unique_users', sa.Integer(), nullable=True),
        sa.Column('active_routers', sa.Integer(), nullable=True),
        sa.Column('average_response_time', sa.Float(), nullable=True),
        sa.Column('peak_concurrent_users', sa.Integer(), nullable=True),
        sa.Column('total_data_transferred', sa.Integer(), nullable=True),
        sa.Column('total_challenges_completed', sa.Integer(), nullable=True),
        sa.Column('average_challenge_score', sa.Float(), nullable=True),
        sa.Column('most_popular_subject', sa.String(length=20), nullable=True),
        sa.Column('most_popular_persona', sa.String(length=20), nullable=True),
        sa.Column('cpu_usage', sa.Float(), nullable=True),
        sa.Column('memory_usage', sa.Float(), nullable=True),
        sa.Column('database_connections', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_metrics_date'), 'system_metrics', ['date'], unique=False)
    op.create_index(op.f('ix_system_metrics_hour'), 'system_metrics', ['hour'], unique=False)

def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_system_metrics_hour'), table_name='system_metrics')
    op.drop_index(op.f('ix_system_metrics_date'), table_name='system_metrics')
    op.drop_table('system_metrics')
    
    op.drop_index(op.f('ix_agent_performance_persona'), table_name='agent_performance')
    op.drop_index(op.f('ix_agent_performance_agent_type'), table_name='agent_performance')
    op.drop_table('agent_performance')
    
    op.drop_index(op.f('ix_learning_paths_router_id'), table_name='learning_paths')
    op.drop_index(op.f('ix_learning_paths_mac_address'), table_name='learning_paths')
    op.drop_table('learning_paths')
    
    op.drop_index(op.f('ix_challenge_analytics_router_id'), table_name='challenge_analytics')
    op.drop_index(op.f('ix_challenge_analytics_mac_address'), table_name='challenge_analytics')
    op.drop_index(op.f('ix_challenge_analytics_challenge_id'), table_name='challenge_analytics')
    op.drop_table('challenge_analytics')
    
    op.drop_index(op.f('ix_student_performance_router_id'), table_name='student_performance')
    op.drop_index(op.f('ix_student_performance_mac_address'), table_name='student_performance')
    op.drop_table('student_performance')
