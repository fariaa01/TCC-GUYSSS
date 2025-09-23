
document.addEventListener('DOMContentLoaded', function() {
	const toggleButton = document.querySelector('.toggle-btn');
	const sidebar = document.querySelector('.sidebar');

	toggleButton.addEventListener('click', function() {
		sidebar.classList.toggle('hidden');
		toggleButton.querySelector('i').classList.toggle('rotate');
	});
});

