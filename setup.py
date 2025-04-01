from setuptools import setup, find_packages

setup(
    name='shopee-analytics',
    version='1.0.0',
    packages=find_packages(),
    install_requires=[
        'fastapi==0.95.0',
        'pydantic==1.10.7',
        'uvicorn',
        'sqlalchemy',
        'requests',
        'python-dotenv'
    ],
    entry_points={
        'console_scripts': [
            'shopee-analytics=app.main:app'
        ]
    },
    include_package_data=True,
    description='Shopee Analytics Application',
    author='Developer',
    author_email='developer@example.com',
    url='https://github.com/developer/shopee-analytics',
    classifiers=[
        'Programming Language :: Python :: 3.9',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.9',
)